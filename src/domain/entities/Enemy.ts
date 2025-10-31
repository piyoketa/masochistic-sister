import type { Action } from './Action'
import type { State } from './State'
import type { Battle } from '../battle/Battle'

export interface EnemyProps {
  id: string
  name: string
  maxHp: number
  currentHp: number
  actions: Action[]
  traits?: State[]
  states?: State[]
  image?: string
}

export class Enemy {
  private readonly idValue: string
  private readonly nameValue: string
  private readonly maxHpValue: number
  private currentHpValue: number
  private readonly actionsValue: Action[]
  private readonly traitsValue: State[]
  private readonly statesValue: State[]
  private readonly imageValue?: string

  constructor(props: EnemyProps) {
    this.idValue = props.id
    this.nameValue = props.name
    this.maxHpValue = props.maxHp
    this.currentHpValue = props.currentHp
    this.actionsValue = props.actions
    this.traitsValue = props.traits ?? []
    this.statesValue = props.states ?? []
    this.imageValue = props.image
  }

  get id(): string {
    return this.idValue
  }

  get name(): string {
    return this.nameValue
  }

  get maxHp(): number {
    return this.maxHpValue
  }

  get currentHp(): number {
    return this.currentHpValue
  }

  get actions(): Action[] {
    return this.actionsValue
  }

  get traits(): State[] {
    return this.traitsValue
  }

  get states(): State[] {
    return this.statesValue
  }

  get image(): string | undefined {
    return this.imageValue
  }

  nextAction(): Action | undefined {
    return undefined
  }

  act(battle: Battle): void {}

  takeDamage(amount: number): void {}

  addState(state: State): void {}

  removeState(stateId: string): void {}

  resetTurn(): void {}
}
