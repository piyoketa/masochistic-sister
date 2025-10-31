import type { Player } from './Player'
import type { Enemy } from './Enemy'
import type { Battle } from '../battle/Battle'
import type { CardDefinition, CardDefinitionBase } from './CardDefinition'

export type ActionCategory = 'attack' | 'skill'

export interface ActionProps {
  id: string
  name: string
  category: ActionCategory
  baseDamage?: number
  hitCount?: number
  description?: string
  cardDefinition: CardDefinitionBase
  descriptionBuilder?: (context: ActionContext) => string
}

export interface ActionContext {
  battle: Battle
  source: Player | Enemy
  target?: Player | Enemy
  metadata?: Record<string, unknown>
}

export class Action {
  private readonly props: ActionProps

  constructor(props: ActionProps) {
    this.props = props
  }

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get category(): ActionCategory {
    return this.props.category
  }

  get baseDamage(): number | undefined {
    return this.props.baseDamage
  }

  get hitCount(): number | undefined {
    return this.props.hitCount
  }

  get description(): string | undefined {
    return this.props.description
  }

  get cardDefinitionBase(): CardDefinitionBase {
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

  execute(context: ActionContext): void {}
}
