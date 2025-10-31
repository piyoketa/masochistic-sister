import type { Battle } from '../battle/Battle'
import type { CardDefinition, CardDefinitionBase } from './CardDefinition'
import type { Enemy } from './Enemy'
import type { Player } from './Player'
import {
  TargetEnemyOperation,
  type CardOperation,
  type Operation,
  type OperationContext,
} from './operations'

export type ActionType = 'attack' | 'skill'

export interface ActionContext {
  battle: Battle
  source: Player | Enemy
  target?: Player | Enemy
  metadata?: Record<string, unknown>
  operations?: Operation[]
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
    const operations = this.buildOperations().map((operation) => operation.type)
    return {
      ...base,
      description: this.createDescription(context),
      operations,
    }
  }

  prepareContext(params: {
    battle: Battle
    source: Player | Enemy
    operations: CardOperation[]
  }): ActionContext {
    const operationContext: OperationContext = {
      battle: params.battle,
      player: params.battle.player,
    }

    const requiredOperations = this.buildOperations().filter((operation) =>
      this.shouldRequireOperation(operation, params),
    )
    const usedOperationIndex = new Set<number>()
    const completedOperations: Operation[] = []
    const metadata: Record<string, unknown> = {}

    for (const operation of requiredOperations) {
      const inputIndex = params.operations.findIndex((candidate, index) => {
        if (usedOperationIndex.has(index)) {
          return false
        }

        return candidate.type === operation.type
      })

      if (inputIndex === -1) {
        throw new Error(`Operation "${operation.type}" is required but missing`)
      }

      const input = params.operations[inputIndex]!
      operation.complete(input.payload, operationContext)

      if (!operation.isCompleted()) {
        throw new Error(`Operation "${operation.type}" is not completed`)
      }

      usedOperationIndex.add(inputIndex)
      completedOperations.push(operation)
      Object.assign(metadata, operation.toMetadata())
    }

    if (usedOperationIndex.size !== params.operations.length) {
      throw new Error('Unexpected operations were supplied')
    }

    const target = this.resolveTarget(metadata, params)

    return {
      battle: params.battle,
      source: params.source,
      target,
      metadata,
      operations: completedOperations,
    }
  }

  protected buildOperations(): Operation[] {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected shouldRequireOperation(
    _operation: Operation,
    _context: { battle: Battle; source: Player | Enemy; operations: CardOperation[] },
  ): boolean {
    return true
  }

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

  protected override buildOperations(): Operation[] {
    return [new TargetEnemyOperation()]
  }

  protected override shouldRequireOperation(
    operation: Operation,
    context: { battle: Battle; source: Player | Enemy; operations: CardOperation[] },
  ): boolean {
    const isPlayerSource = 'currentMana' in context.source
    if (!isPlayerSource && operation.type === TargetEnemyOperation.TYPE) {
      return false
    }

    return true
  }

  protected override resolveTarget(
    metadata: Record<string, unknown> | undefined,
    context: { battle: Battle; source: Player | Enemy },
  ): Player | Enemy | undefined {
    const isPlayerSource = 'currentMana' in context.source
    if (isPlayerSource) {
      const targetId = (metadata as { targetEnemyId?: number } | undefined)?.targetEnemyId
      if (typeof targetId !== 'number') {
        throw new Error('Attack requires targetEnemyId')
      }

      const target = context.battle.enemyTeam.findEnemyByNumericId(targetId)
      if (!target) {
        throw new Error(`Enemy ${targetId} not found`)
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
