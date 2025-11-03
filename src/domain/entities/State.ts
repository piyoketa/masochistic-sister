import type { CardDefinition } from './CardDefinition'
import type { DamageCalculationParams } from './Damages'

export interface StateProps {
  id: string
  name: string
  magnitude?: number
  cardDefinition?: CardDefinition
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

  get cardDefinitionBase(): CardDefinition | undefined {
    return this.props.cardDefinition
  }

  description(): string {
    return ''
  }

  createCardDefinition(): CardDefinition {
    const base = this.cardDefinitionBase
    if (!base) {
      throw new Error('State does not provide a card definition')
    }

    return { ...base }
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
