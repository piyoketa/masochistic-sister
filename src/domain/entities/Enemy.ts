import type { Action } from './Action'
import type { State } from './State'
import type { Battle } from '../battle/Battle'

export interface EnemyProps {
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
  private readonly nameValue: string
  private readonly maxHpValue: number
  private currentHpValue: number
  private readonly actionsValue: Action[]
  private readonly traitsValue: State[]
  private readonly statesValue: State[]
  private readonly imageValue?: string
  private actionPointer: number
  private repositoryId?: number

  constructor(props: EnemyProps) {
    this.nameValue = props.name
    this.maxHpValue = props.maxHp
    this.currentHpValue = props.currentHp
    this.actionsValue = props.actions
    this.traitsValue = props.traits ?? []
    this.statesValue = props.states ?? []
    this.imageValue = props.image
    this.actionPointer = props.startingActionIndex ?? 0
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

  get numericId(): number | undefined {
    return this.repositoryId
  }

  assignRepositoryId(id: number): void {
    if (this.repositoryId !== undefined && this.repositoryId !== id) {
      throw new Error(`Enemy already assigned to repository id ${this.repositoryId}`)
    }

    this.repositoryId = id
  }

  hasRepositoryId(): boolean {
    return this.repositoryId !== undefined
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
      operations: [],
    })

    action.execute(preparedContext)

    this.advanceActionPointer()
  }

  takeDamage(amount: number): void {
    this.currentHpValue = Math.max(0, this.currentHpValue - Math.max(0, Math.floor(amount)))
  }

  addState(state: State): void {}

  removeState(stateId: string): void {}

  resetTurn(): void {}

  private advanceActionPointer(): void {
    this.actionPointer = (this.actionPointer + 1) % Math.max(1, this.actionsValue.length)
  }
}
