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

  stackWith(state: State): void {
    if (state.id !== this.id) {
      throw new Error(`State "${this.id}" cannot be stacked with different id "${state.id}"`)
    }

    const incoming = state.magnitude ?? 0
    if (incoming === 0) {
      return
    }

    const current = this.magnitude ?? 0
    this.setMagnitude(current + incoming)
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

  protected setMagnitude(value: number | undefined): void {
    this.props.magnitude = value
  }
}
