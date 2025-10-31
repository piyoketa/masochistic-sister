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
  startingActionIndex?: number
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
  private actionPointer: number

  constructor(props: EnemyProps) {
    this.idValue = props.id
    this.nameValue = props.name
    this.maxHpValue = props.maxHp
    this.currentHpValue = props.currentHp
    this.actionsValue = props.actions
    this.traitsValue = props.traits ?? []
    this.statesValue = props.states ?? []
    this.imageValue = props.image
    this.actionPointer = props.startingActionIndex ?? 0
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

  // TODO: 敵の行動管理の方式を変更する
  nextAction(): Action | undefined {
    if (this.actionsValue.length === 0) {
      return undefined
    }

    return this.actionsValue[this.actionPointer % this.actionsValue.length]
  }

  act(battle: Battle): void {
    const action = this.nextAction()
    if (!action) {
      return
    }

    const preparedContext = action.prepareContext({
      battle,
      source: this,
      operation: undefined,
    })

    action.execute(preparedContext)

    this.advanceActionPointer()
  }

  takeDamage(amount: number): void {}

  addState(state: State): void {}

  removeState(stateId: string): void {}

  resetTurn(): void {}

  private advanceActionPointer(): void {
    this.actionPointer = (this.actionPointer + 1) % Math.max(1, this.actionsValue.length)
  }
}
