import type { Battle } from '../battle/Battle'
import type { CardDefinition, CardDefinitionBase } from './CardDefinition'
import type { Enemy } from './Enemy'
import type { Player } from './Player'
import { assertTargetEnemyOperation, type TargetEnemyOperation } from './operations'

export type ActionType = 'attack' | 'skill'

export interface ActionContext {
  battle: Battle
  source: Player | Enemy
  target?: Player | Enemy
  metadata?: Record<string, unknown>
}

export interface BaseActionProps {
  id: string
  name: string
  description?: string
  descriptionBuilder?: (context: ActionContext) => string
  cardDefinition: CardDefinitionBase
}

export abstract class Action {
  protected readonly props: BaseActionProps

  protected constructor(props: BaseActionProps) {
    this.props = props
  }

  abstract get type(): ActionType

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }

  protected get cardDefinitionBase(): CardDefinitionBase {
    return this.props.cardDefinition
  }

  createDescription(context?: ActionContext): string {
    if (this.props.descriptionBuilder && context) {
      return this.props.descriptionBuilder(context)
    }

    if (this.props.description) {
      return this.props.description
    }

    return ''
  }

  createCardDefinition(context?: ActionContext): CardDefinition {
    const base = this.cardDefinitionBase
    return {
      ...base,
      description: this.createDescription(context),
    }
  }

  prepareContext(params: { battle: Battle; source: Player | Enemy; operation?: unknown }): ActionContext {
    const metadata = this.validateOperation(params.operation, params)
    const target = this.resolveTarget(metadata, params)

    return {
      battle: params.battle,
      source: params.source,
      target,
      metadata,
    }
  }

  protected validateOperation(
    operation: unknown,
    _context: { battle: Battle; source: Player | Enemy },
  ): Record<string, unknown> | undefined {
    if (operation === undefined) {
      return undefined
    }

    if (typeof operation !== 'object' || operation === null) {
      throw new Error('Invalid operation payload')
    }

    return operation as Record<string, unknown>
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected resolveTarget(
    _metadata: Record<string, unknown> | undefined,
    _context: { battle: Battle; source: Player | Enemy },
  ): Player | Enemy | undefined {
    return undefined
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  execute(_context: ActionContext): void {}
}

export interface SkillProps extends BaseActionProps {}

export abstract class Skill extends Action {
  protected constructor(props: SkillProps) {
    super(props)
  }

  get type(): ActionType {
    return 'skill'
  }
}

export interface AttackProps extends BaseActionProps {
  baseDamage: number
  hitCount?: number
}

export abstract class Attack extends Action {
  protected readonly baseDamageValue: number
  protected readonly hitCountValue: number

  protected constructor(props: AttackProps) {
    super(props)
    this.baseDamageValue = props.baseDamage
    this.hitCountValue = props.hitCount ?? 1
  }

  get type(): ActionType {
    return 'attack'
  }

  get baseDamage(): number {
    return this.baseDamageValue
  }

  get hitCount(): number {
    return this.hitCountValue
  }

  calculateDamage(_context?: ActionContext): number[] {
    return []
  }

  protected override validateOperation(
    operation: unknown,
    context: { battle: Battle; source: Player | Enemy },
  ): Record<string, unknown> | undefined {
    const isPlayerSource = 'currentMana' in context.source
    if (isPlayerSource) {
      assertTargetEnemyOperation(operation)
      return operation as TargetEnemyOperation
    }

    return super.validateOperation(operation, context)
  }

  protected override resolveTarget(
    metadata: Record<string, unknown> | undefined,
    context: { battle: Battle; source: Player | Enemy },
  ): Player | Enemy | undefined {
    const isPlayerSource = 'currentMana' in context.source
    if (isPlayerSource) {
      const targetEnemyId = (metadata as TargetEnemyOperation | undefined)?.targetEnemyId
      if (!targetEnemyId) {
        throw new Error('Attack requires targetEnemyId')
      }

      const target = context.battle.enemyTeam.findEnemy(targetEnemyId)
      if (!target) {
        throw new Error(`Enemy ${targetEnemyId} not found`)
      }

      return target
    }

    return context.battle.player
  }
}

export abstract class SingleAttack extends Attack {
  protected constructor(props: AttackProps) {
    super({ ...props, hitCount: 1 })
  }

  override calculateDamage(): number[] {
    return [this.baseDamage]
  }
}

export abstract class ContinuousAttack extends Attack {
  protected constructor(props: AttackProps & { hitCount: number }) {
    super(props)
  }

  override calculateDamage(): number[] {
    return Array.from({ length: this.hitCount }, () => this.baseDamage)
  }
}
