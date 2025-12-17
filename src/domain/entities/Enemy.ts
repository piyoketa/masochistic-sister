import type { Action } from './Action/ActionBase'
import type { State } from './State'
import type { Battle, DamageEvent } from '../battle/Battle'
import type { EnemyActionQueue, EnemyActionQueueStateSnapshot } from './enemy/actionQueues'
import { DefaultEnemyActionQueue } from './enemy/actionQueues'
import type { Player } from './Player'

// 敵の acted 状態調査用のデバッグログ出力を環境変数で制御する。
const DEBUG_ENEMY_ACTED =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEBUG_ENEMY_ACTED === 'true') ||
  (typeof process !== 'undefined' && process.env?.VITE_DEBUG_ENEMY_ACTED === 'true')

function debugEnemyActedLog(message: string, payload: Record<string, unknown>): void {
  if (!DEBUG_ENEMY_ACTED) return
  // eslint-disable-next-line no-console
  console.log(message, payload)
}

export interface EnemyProps {
  name: string
  maxHp: number
  currentHp: number
  actions: Action[]
  states?: State[]
  image: string
  futureActions?: Action[]
  rng?: () => number
  rngSeed?: number | string
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
  private readonly rngSeed?: number | string
  private readonly actionHistory: Action[] = []
  private readonly actionQueue: EnemyActionQueue
  private readonly allyTagsValue: string[]
  private readonly allyBuffWeightsValue: Record<string, number>
  private actedThisTurn = false
  private idValue?: number
  private statusValue: EnemyStatus = 'active'
  private lastActionContextMetadata?: Record<string, unknown>

  constructor(props: EnemyProps) {
    this.nameValue = props.name
    this.maxHpValue = props.maxHp
    this.currentHpValue = props.currentHp
    this.actionCandidates = [...props.actions]
    this.stateList = [...(props.states ?? [])]
    this.imageValue = props.image
    this.rngSeed = props.rngSeed
    this.rng = props.rng ?? Math.random
    this.allyTagsValue = [...(props.allyTags ?? [])]
    this.allyBuffWeightsValue = { ...(props.allyBuffWeights ?? {}) }
    this.actionQueue = props.actionQueueFactory ? props.actionQueueFactory() : new DefaultEnemyActionQueue()
    this.actionQueue.initialize(this.actionCandidates, this.rng, this.rngSeed)
    if (props.futureActions) {
      for (const action of props.futureActions) {
        this.actionQueue.scheduleActionForNextTurn(action, { replace: false })
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

  get queuedActionEntries(): import('./enemy/actionQueues').EnemyTurnActionEntry[] {
    return this.actionQueue.peekEntries()
  }

  /**
   * 指定ターンの行動を確定させて取得する（履歴に残す）。
   * Enemy/Team/Battle コンテキストを渡し、計画フェーズ（味方バフのターゲット決定など）も同時に走らせる。
   */
  confirmActionForTurn(turn: number, context?: { battle?: Battle; team?: import('./EnemyTeam').EnemyTeam }): Action | null {
    return this.actionQueue.ensureActionForTurn(turn, { ...context, enemy: this })
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

  setQueueContext(context: Record<string, unknown>): void {
    this.actionQueue.setContext(context)
  }

  refreshPlannedActionsForDisplay(): void {}

  clearPlannedActionsForDisplay(): void {}

  sampleRng(): number {
    return this.rng()
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
    this.lastActionContextMetadata = undefined
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
      debugEnemyActedLog('[Enemy] act skipped (already acted)', {
        name: this.name,
        id: this.id,
        actedThisTurn: this.actedThisTurn,
        turn: battle.turnPosition.turn,
        side: battle.turnPosition.side,
      })
      return
    }

    // キューにバトルコンテキストをセット（条件付きキュー用）
    if (typeof (this.actionQueue as any).setContext === 'function') {
      ;(this.actionQueue as any).setContext({ battle, owner: this })
    }

    const action = this.actionQueue.ensureActionForTurn(battle.turnPosition.turn, {
      battle,
      enemy: this,
      team: battle.enemyTeam,
    })
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
    debugEnemyActedLog('[Enemy] act executed', {
      name: this.name,
      id: this.id,
      turn: battle.turnPosition.turn,
      side: battle.turnPosition.side,
      action: action.name,
      actedThisTurn: this.actedThisTurn,
    })
    this.lastActionContextMetadata = preparedContext.metadata ? { ...preparedContext.metadata } : undefined
  }

  takeDamage(event: DamageEvent, options?: { battle?: Battle; animation?: DamageEvent }): void {
    const total = event.outcomes.reduce((sum, outcome) => sum + Math.max(0, Math.floor(outcome.damage)), 0)
    if (total <= 0) {
      return
    }
    const previousHp = this.currentHpValue
    this.currentHpValue = Math.max(0, this.currentHpValue - total)
    const animation = options?.animation ?? event
    if (options?.battle && animation) {
      options.battle.recordDamageAnimation(animation)
    }
    if (this.currentHpValue <= 0 && previousHp > 0) {
      this.statusValue = 'defeated'
      if (options?.battle) {
        this.forEachState((state) =>
          state.onOwnerDefeated({
            battle: options.battle!,
            owner: this,
          }),
        )
        // 味方側の仲間想い系Traitへ通知する。Team全体でイベントを共有するため、敗北した本人以外のEnemyに伝播する。
        if ('enemyTeam' in options.battle && options.battle.enemyTeam?.members) {
          for (const ally of options.battle.enemyTeam.members) {
            if (ally === this || !ally.isActive()) {
              continue
            }
            ally.forEachState((state) =>
              state.onAllyDefeated({
                battle: options.battle!,
                owner: ally,
                ally: this,
              }),
            )
          }
        }
      }
      if (options?.battle && this.id !== undefined) {
        options.battle.recordDefeatAnimation(this.id)
      }
    }
  }

  applySpecialDamage(amount: number, _context?: { battle?: Battle; reason?: string }): void {
    const damage = Math.max(0, Math.floor(amount))
    if (damage <= 0) {
      return
    }
    const previousHp = this.currentHpValue
    this.currentHpValue = Math.max(0, this.currentHpValue - damage)
    // 特殊ダメージでは現状演出なし。必要ならbattle.recordDamageAnimationを追加する。
    if (this.currentHpValue <= 0 && previousHp > 0) {
      this.statusValue = 'defeated'
      // ステート通知や敗北演出は takeDamage と同様に必要なら後日追加
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
    this.actionQueue.clearScheduledActions()
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
    const existing = this.stateList.find((entry) => entry.id === state.id)
    if (existing) {
      existing.stackWith(state)
      return
    }
    this.stateList.push(state)
  }

  removeState(stateId: string): void {
    const index = this.stateList.findIndex((state) => state.id === stateId)
    if (index >= 0) {
      this.stateList.splice(index, 1)
    }
  }

  resetTurn(): void {
    debugEnemyActedLog('[Enemy] resetTurn', {
      name: this.name,
      id: this.id,
      actedBeforeReset: this.actedThisTurn,
    })
    this.actedThisTurn = false
    this.actionQueue.resetTurn()
  }

  consumeLastActionMetadata(): Record<string, unknown> | undefined {
    if (!this.lastActionContextMetadata) {
      return undefined
    }
    const metadata = { ...this.lastActionContextMetadata }
    this.lastActionContextMetadata = undefined
    return metadata
  }

  getStates(): State[] {
    return [...this.stateList]
  }

  /**
   * 指定ターンの行動を別のアクションに置き換える。元の行動を返す。
   * 天の鎖など、すでに確定済みの行動を書き換える用途で使用する。
   */
  replaceActionForTurn(turn: number, action: Action): Action | undefined {
    return this.actionQueue.replaceActionForTurn(turn, action)
  }

  discardNextScheduledAction(currentTurn?: number): Action | undefined {
    const discarded = this.actionQueue.discardTurn(currentTurn)
    return discarded
  }

  queueImmediateAction(action: Action): void {
    this.actionQueue.scheduleActionForNextTurn(action, { replace: true })
  }

  enqueueAction(action: Action): void {
    this.actionQueue.scheduleActionForNextTurn(action, { replace: true })
  }

  prependAction(action: Action): void {
    this.actionQueue.scheduleActionForNextTurn(action, { replace: true })
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
