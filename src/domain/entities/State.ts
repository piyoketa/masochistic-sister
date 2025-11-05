import type { CardDefinition } from './CardDefinition'
import type { DamageCalculationParams } from './Damages'
import type { Battle } from '../battle/Battle'
import type { Player } from './Player'
import type { Enemy } from './Enemy'
import type { Action } from './Action'

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTurnStart(_context: { battle: Battle; owner: Player | Enemy }): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onActionResolved(_context: {
    battle: Battle
    owner: Player | Enemy
    actor: Player | Enemy
    action: Action
  }): void {}

  protected setMagnitude(value: number | undefined): void {
    this.props.magnitude = value
  }
}
