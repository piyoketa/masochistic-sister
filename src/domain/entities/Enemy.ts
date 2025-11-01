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
  futureActions?: Action[]
  rng?: () => number
}

export class Enemy {
  private readonly nameValue: string
  private readonly maxHpValue: number
  private currentHpValue: number
  private readonly actionCandidates: Action[]
  private readonly traitList: State[]
  private readonly stateList: State[]
  private readonly imageValue?: string
  private readonly rng: () => number
  private readonly actionHistory: Action[] = []
  private futureActions: Action[]
  private actedThisTurn = false
  private repositoryId?: number

  constructor(props: EnemyProps) {
    this.nameValue = props.name
    this.maxHpValue = props.maxHp
    this.currentHpValue = props.currentHp
    this.actionCandidates = [...props.actions]
    this.traitList = [...(props.traits ?? [])]
    this.stateList = [...(props.states ?? [])]
    this.imageValue = props.image
    this.futureActions = props.futureActions ? [...props.futureActions] : []
    this.rng = props.rng ?? Math.random
    this.ensureFutureActions()
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
    return [...this.futureActions]
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

  act(battle: Battle): void {
    if (this.actedThisTurn) {
      battle.addLogEntry({
        message: `${this.name}は既に行動したため、何もしなかった。`,
        metadata: { enemyId: this.numericId, reason: 'already-acted' },
      })
      return
    }

    this.ensureFutureActions()
    const action = this.futureActions.shift()
    if (!action) {
      battle.addLogEntry({
        message: `${this.name}は行動候補を持っていない。`,
        metadata: { enemyId: this.numericId, reason: 'no-actions' },
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
    this.ensureFutureActions()
  }

  takeDamage(amount: number): void {
    this.currentHpValue = Math.max(0, this.currentHpValue - Math.max(0, Math.floor(amount)))
  }

  addState(state: State): void {
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
    this.ensureFutureActions()
  }

  getStates(): State[] {
    return [...this.traitList, ...this.stateList]
  }

  queueImmediateAction(action: Action): void {
    this.futureActions.unshift(action)
    this.ensureFutureActions()
  }

  enqueueAction(action: Action): void {
    this.futureActions.push(action)
    this.ensureFutureActions()
  }

  private ensureFutureActions(): void {
    while (this.futureActions.length < 2) {
      const next = this.pickNextAction()
      if (!next) {
        break
      }
      this.futureActions.push(next)
    }
  }

  private pickNextAction(): Action | undefined {
    if (this.actionCandidates.length === 0) {
      return undefined
    }

    const lastScheduled =
      this.futureActions.length > 0
        ? this.futureActions[this.futureActions.length - 1]
        : this.actionHistory[this.actionHistory.length - 1]

    const pool =
      this.actionCandidates.length > 1 && lastScheduled
        ? this.actionCandidates.filter((candidate) => candidate !== lastScheduled)
        : [...this.actionCandidates]

    const index = pool.length === 0 ? 0 : Math.floor(this.rng() * pool.length) % pool.length
    const selection = pool[index] ?? this.actionCandidates[0]
    return selection
  }
}
