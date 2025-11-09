import type { CardDefinition } from './CardDefinition'
import type { DamageCalculationParams, DamageOutcome, Damages } from './Damages'
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

  get priority(): number {
    return 10
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

  isPreHitModifier(): boolean {
    return false
  }

  isPostHitModifier(): boolean {
    return false
  }

  affectsAttacker(): boolean {
    return false
  }

  affectsDefender(): boolean {
    return false
  }

  modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    return params
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTurnStart(_context: { battle: Battle; owner: Player | Enemy }): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onPlayerTurnStart(_context: { battle: Battle; owner: Player | Enemy }): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onActionResolved(_context: {
    battle: Battle
    owner: Player | Enemy
    actor: Player | Enemy
    action: Action
  }): void {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onHitResolved(_context: DamageHitContext): boolean {
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDamageSequenceResolved(_context: DamageSequenceContext): void {}

  protected setMagnitude(value: number | undefined): void {
    this.props.magnitude = value
  }
}

export interface DamageHitContext {
  battle: Battle
  attack: Action
  attacker: Player | Enemy
  defender: Player | Enemy
  damages: Damages
  index: number
  outcome: DamageOutcome
  role: 'attacker' | 'defender'
}

export interface DamageSequenceContext {
  battle: Battle
  attack: Action
  attacker: Player | Enemy
  defender: Player | Enemy
  damages: Damages
  outcomes: readonly DamageOutcome[]
}
