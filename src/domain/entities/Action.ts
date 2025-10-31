import type { Battle } from '../battle/Battle'
import type { CardDefinition, CardDefinitionBase } from './CardDefinition'
import type { Enemy } from './Enemy'
import type { Player } from './Player'

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

  calculateDamage(context?: ActionContext): number[] {
    return []
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
