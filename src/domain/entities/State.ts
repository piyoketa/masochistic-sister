import type { CardDefinition, CardDefinitionBase } from './CardDefinition'
import type { DamageCalculationParams } from './Damages'

export interface StateProps {
  id: string
  name: string
  magnitude?: number
  description?: string
  cardDefinition?: CardDefinitionBase
  descriptionBuilder?: (state: State) => string
}

export class State {
  private readonly props: StateProps

  constructor(props: StateProps) {
    this.props = props
  }

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get magnitude(): number | undefined {
    return this.props.magnitude
  }

  description(): string {
    return this.createDescription()
  }

  get cardDefinitionBase(): CardDefinitionBase | undefined {
    return this.props.cardDefinition
  }

  createDescription(): string {
    if (this.props.descriptionBuilder) {
      return this.props.descriptionBuilder(this)
    }

    if (this.props.description) {
      return this.props.description
    }

    return ''
  }

  createCardDefinition(): CardDefinition {
    const base = this.cardDefinitionBase
    if (!base) {
      throw new Error('State does not provide a card definition')
    }

    return {
      ...base,
      description: this.description(),
    }
  }

  apply(): void {}

  remove(): void {}

  affectsAttacker(): boolean {
    return false
  }

  affectsDefender(): boolean {
    return false
  }

  modifyDamage(params: DamageCalculationParams): DamageCalculationParams {
    return params
  }
}
