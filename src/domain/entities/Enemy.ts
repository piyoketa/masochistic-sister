import type { Action } from './Action'
import type { State } from './State'
import type { Battle, DamageAnimationEvent } from '../battle/Battle'
import type { EnemyActionQueue, EnemyActionQueueStateSnapshot } from './enemy/actionQueues'
import { DefaultEnemyActionQueue } from './enemy/actionQueues'
import type { Player } from './Player'

export interface EnemyProps {
  name: string
  maxHp: number
  currentHp: number
  actions: Action[]
  states?: State[]
  image: string
  futureActions?: Action[]
  rng?: () => number
  actionQueueFactory?: () => EnemyActionQueue
  allyTags?: string[]
  allyBuffWeights?: Record<string, number>
}

export type EnemyStatus = 'active' | 'defeated' | 'escaped'

export interface EnemyQueueSnapshot {
  queueState: EnemyActionQueueStateSnapshot
  actionHistory: Action[]
}

export class Enemy {
  private readonly nameValue: string
  private readonly maxHpValue: number
  private currentHpValue: number
  private readonly actionCandidates: Action[]
  private readonly stateList: State[]
  private readonly imageValue: string
  private readonly rng: () => number
  private readonly actionHistory: Action[] = []
  private readonly actionQueue: EnemyActionQueue
  private readonly allyTagsValue: string[]
  private readonly allyBuffWeightsValue: Record<string, number>
  private actedThisTurn = false
  private idValue?: number
  private statusValue: EnemyStatus = 'active'

  constructor(props: EnemyProps) {
    this.nameValue = props.name
    this.maxHpValue = props.maxHp
    this.currentHpValue = props.currentHp
    this.actionCandidates = [...props.actions]
    this.stateList = [...(props.states ?? [])]
    this.imageValue = props.image
    this.rng = props.rng ?? Math.random
    this.allyTagsValue = [...(props.allyTags ?? [])]
    this.allyBuffWeightsValue = { ...(props.allyBuffWeights ?? {}) }
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

  get states(): State[] {
    return [...this.stateList]
  }

  get image(): string {
    return this.imageValue
  }

  get id(): number | undefined {
    return this.idValue
  }

  get status(): EnemyStatus {
    return this.statusValue
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
    if (!this.isActive()) {
      battle.addLogEntry({
        message: `${this.name}は戦線から離脱しているため、行動できない。`,
        metadata: { enemyId: this.id, reason: 'inactive' },
      })
      return
    }

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

  takeDamage(
    amount: number,
    options?: { battle?: Battle; animation?: DamageAnimationEvent },
  ): void {
    const damage = Math.max(0, Math.floor(amount))
    if (damage <= 0) {
      return
    }
    const previousHp = this.currentHpValue
    this.currentHpValue = Math.max(0, this.currentHpValue - damage)
    if (options?.battle && options.animation) {
      const event: DamageAnimationEvent = {
        ...options.animation,
        targetId: options.animation.targetId ?? this.id,
      }
      options.battle.recordDamageAnimation(event)
    }
    if (this.currentHpValue <= 0 && previousHp > 0) {
      this.statusValue = 'defeated'
      if (options?.battle && this.id !== undefined) {
        options.battle.recordDefeatAnimation(this.id)
      }
    }
  }

  heal(amount: number): void {
    const healAmount = Math.max(0, Math.floor(amount))
    if (healAmount <= 0) {
      return
    }
    this.currentHpValue = Math.min(this.maxHpValue, this.currentHpValue + healAmount)
  }

  flee(battle: Battle): void {
    if (this.statusValue !== 'active') {
      return
    }
    this.statusValue = 'escaped'
    this.actionQueue.clearAll()
    battle.addLogEntry({
      message: `${this.name}は恐怖に駆られて逃走した。`,
      metadata: { enemyId: this.id, reason: 'flee' },
    })
    battle.recordStateEvent({
      subject: 'enemy',
      subjectId: this.id,
      stateId: 'trait-coward',
      payload: { result: 'escape' },
    })
    battle.onEnemyStatusChanged()
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
    return [...this.stateList]
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

  hasAllyTag(tag: string): boolean {
    return this.allyTagsValue.includes(tag)
  }

  getAllyBuffWeight(key: string): number {
    return this.allyBuffWeightsValue[key] ?? 0
  }

  isActive(): boolean {
    return this.statusValue === 'active' && this.currentHpValue > 0
  }

  handleTurnStart(battle: Battle): void {
    if (!this.isActive()) {
      return
    }
    this.forEachState((state) => state.onTurnStart({ battle, owner: this }))
  }

  handlePlayerTurnStart(battle: Battle): void {
    if (!this.isActive()) {
      return
    }
    this.forEachState((state) => state.onPlayerTurnStart({ battle, owner: this }))
  }

  handleActionResolved(battle: Battle, actor: Player | Enemy, action: Action): void {
    this.forEachState((state) =>
      state.onActionResolved({
        battle,
        owner: this,
        actor,
        action,
      }),
    )
  }

  serializeQueueSnapshot(): EnemyQueueSnapshot {
    return {
      queueState: this.actionQueue.serializeState(),
      actionHistory: [...this.actionHistory],
    }
  }

  restoreQueueSnapshot(snapshot: EnemyQueueSnapshot): void {
    this.actionQueue.restoreState(snapshot.queueState)
    this.actionHistory.length = 0
    this.actionHistory.push(...snapshot.actionHistory)
  }

  setCurrentHp(value: number): void {
    this.currentHpValue = Math.max(0, Math.min(this.maxHpValue, Math.floor(value)))
  }

  setStatus(status: EnemyStatus): void {
    this.statusValue = status
  }

  setHasActedThisTurn(acted: boolean): void {
    this.actedThisTurn = acted
  }

  replaceStates(states: State[]): void {
    this.stateList.length = 0
    this.stateList.push(...states)
  }

  private forEachState(consumer: (state: State) => void): void {
    for (const state of this.stateList) {
      consumer(state)
    }
  }
}
