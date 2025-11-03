import type { Action } from './Action'
import type { State } from './State'
import type { Battle } from '../battle/Battle'
import type { EnemyActionQueue } from './enemy/actionQueues'
import { DefaultEnemyActionQueue } from './enemy/actionQueues'

export interface EnemyProps {
  name: string
  maxHp: number
  currentHp: number
  actions: Action[]
  traits?: State[]
  states?: State[]
  image: string
  futureActions?: Action[]
  rng?: () => number
  actionQueueFactory?: () => EnemyActionQueue
}

export class Enemy {
  private readonly nameValue: string
  private readonly maxHpValue: number
  private currentHpValue: number
  private readonly actionCandidates: Action[]
  private readonly traitList: State[]
  private readonly stateList: State[]
  private readonly imageValue: string
  private readonly rng: () => number
  private readonly actionHistory: Action[] = []
  private readonly actionQueue: EnemyActionQueue
  private actedThisTurn = false
  private idValue?: number

  constructor(props: EnemyProps) {
    this.nameValue = props.name
    this.maxHpValue = props.maxHp
    this.currentHpValue = props.currentHp
    this.actionCandidates = [...props.actions]
    this.traitList = [...(props.traits ?? [])]
    this.stateList = [...(props.states ?? [])]
    this.imageValue = props.image
    this.rng = props.rng ?? Math.random
    this.actionQueue = props.actionQueueFactory ? props.actionQueueFactory() : new DefaultEnemyActionQueue()
    this.actionQueue.initialize(this.actionCandidates, this.rng)
    if (props.futureActions) {
      for (const action of props.futureActions) {
        this.actionQueue.append(action)
      }
    }
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
    return [...this.actionCandidates]
  }

  get queuedActions(): Action[] {
    return this.actionQueue.peek()
  }

  get actionLog(): Action[] {
    return [...this.actionHistory]
  }

  get hasActedThisTurn(): boolean {
    return this.actedThisTurn
  }

  get traits(): State[] {
    return [...this.traitList]
  }

  get states(): State[] {
    return [...this.stateList]
  }

  get image(): string {
    return this.imageValue
  }

  get id(): number | undefined {
    return this.idValue
  }

  assignId(id: number): void {
    if (this.idValue !== undefined && this.idValue !== id) {
      throw new Error(`Enemy already assigned to repository id ${this.idValue}`)
    }

    this.idValue = id
  }

  hasId(): boolean {
    return this.idValue !== undefined
  }

  act(battle: Battle): void {
    if (this.actedThisTurn) {
      battle.addLogEntry({
        message: `${this.name}は既に行動したため、何もしなかった。`,
        metadata: { enemyId: this.id, reason: 'already-acted' },
      })
      return
    }

    const action = this.actionQueue.next()
    if (!action) {
      battle.addLogEntry({
        message: `${this.name}は行動候補を持っていない。`,
        metadata: { enemyId: this.id, reason: 'no-actions' },
      })
      return
    }

    const preparedContext = action.prepareContext({
      battle,
      source: this,
      operations: [],
    })

    action.execute(preparedContext)
    this.actionHistory.push(action)
    this.actedThisTurn = true
  }

  takeDamage(amount: number): void {
    this.currentHpValue = Math.max(0, this.currentHpValue - Math.max(0, Math.floor(amount)))
  }

  addState(state: State, _options?: { battle?: Battle }): void {
    this.stateList.push(state)
  }

  removeState(stateId: string): void {
    const index = this.stateList.findIndex((state) => state.id === stateId)
    if (index >= 0) {
      this.stateList.splice(index, 1)
    }
  }

  resetTurn(): void {
    this.actedThisTurn = false
    this.actionQueue.resetTurn()
  }

  getStates(): State[] {
    return [...this.traitList, ...this.stateList]
  }

  discardNextScheduledAction(): Action | undefined {
    return this.actionQueue.discardNext()
  }

  queueImmediateAction(action: Action): void {
    this.actionQueue.prepend(action)
  }

  enqueueAction(action: Action): void {
    this.actionQueue.append(action)
  }

  prependAction(action: Action): void {
    this.actionQueue.prepend(action)
  }
}
