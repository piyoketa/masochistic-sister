/*
ViewManager.ts の責務:
- OperationLog（プレイヤー操作列）と Battle/ActionLog を橋渡しし、UI が参照するスナップショットやアニメーションキューを管理する。
- OperationLog を追加・巻き戻しした際に、OperationRunner を用いて Battle/ActionLog を再構築・進行させる。
- View 層からの入力キューとロック制御、イベント通知を担う。

責務ではないこと:
- ダメージ計算や敵行動などのドメインロジックそのもの（Battle/Action が担う）。
- 具体的な描画や CSS アニメーション。ここでは AnimationScript のキューを管理するだけで、描画は `BattleView` 側へ委譲する。
- OperationLog の永続化。現状ではメモリ内のセッションのみを扱う。
*/
import { reactive, readonly } from 'vue'
import type { CardOperation } from '@/domain/entities/operations'
import type { Enemy } from '@/domain/entities/Enemy'
import type { Card } from '@/domain/entities/Card'
import { OperationLog, type OperationLogEntry } from '@/domain/battle/OperationLog'
import {
  OperationRunner,
  OperationRunnableError,
  type EntryAppendContext,
} from '@/domain/battle/OperationRunner'
import { ActionLog, type BattleActionLogEntry } from '@/domain/battle/ActionLog'
import {
  type ResolvedBattleActionLogEntry,
  type ResolvedPlayCardOperation,
  type EnemySummary,
  type CardSummary,
} from '@/domain/battle/ActionLogReplayer'
import type { Battle, BattleSnapshot } from '@/domain/battle/Battle'

export interface ViewManagerConfig {
  createBattle: () => Battle
  operationLog?: OperationLog
  playbackOptions?: {
    defaultSpeed?: number
    autoPlay?: boolean
  }
  initialOperationIndex?: number
}

export type PlayerInput =
  | { type: 'play-card'; cardId: number; operations?: CardOperation[] }
  | { type: 'end-player-turn' }
  | { type: 'start-battle' }
  | { type: 'custom'; action: string; payload?: unknown }

export type AnimationCommand =
  | {
      type: 'update-snapshot'
      snapshot: BattleSnapshot
      resolvedEntry?: ResolvedBattleActionLogEntry
    }
  | { type: 'wait'; duration: number }
  | { type: 'set-input-lock'; locked: boolean }
  | { type: 'custom'; name: string; payload?: unknown }

export interface AnimationScript {
  id: string
  entryIndex: number
  commands: AnimationCommand[]
  resolvedEntry?: ResolvedBattleActionLogEntry
  metadata?: {
    canSkip?: boolean
    estimatedDuration?: number
  }
}

export type AnimationScriptInput = Omit<AnimationScript, 'id'> & { id?: string }

export interface BattleViewState {
  snapshot?: BattleSnapshot
  previousSnapshot?: BattleSnapshot
  lastResolvedEntry?: ResolvedBattleActionLogEntry
  actionLogLength: number
  executedIndex: number
  playback: {
    status: 'idle' | 'initializing' | 'playing' | 'paused'
    speed: number
    autoPlay: boolean
    queue: AnimationScript[]
    current?: {
      script: AnimationScript
      startedAt: number
    }
  }
  input: {
    locked: boolean
    queued: PlayerInput[]
  }
}

export type ViewManagerEvent =
  | { type: 'state'; state: Readonly<BattleViewState> }
  | { type: 'initialized'; state: Readonly<BattleViewState> }
  | { type: 'animation-start'; script: AnimationScript }
  | { type: 'animation-complete'; script: AnimationScript }
  | { type: 'input-lock-changed'; locked: boolean }
  | { type: 'error'; error: Error }

export type ViewManagerEventListener = (event: ViewManagerEvent) => void

export class ViewManager {
  private readonly createBattle: () => Battle
  private readonly operationLog: OperationLog
  private readonly stateValue: BattleViewState
  private readonly stateProxy: Readonly<BattleViewState>
  private readonly listeners = new Set<ViewManagerEventListener>()
  private readonly initialOperationIndex: number
  private animationSequence = 0
  private isProcessingInputQueue = false
  private isInitializing = false

  private actionLog: ActionLog = new ActionLog()
  private battleInstance?: Battle
  private executedOperationIndex = -1
  private operationRunner?: OperationRunner
  private suspendRunnerEvents = false

  constructor(config: ViewManagerConfig) {
    this.createBattle = config.createBattle
    const sourceOperationLog = config.operationLog ?? new OperationLog()
    const sourceEntries = sourceOperationLog.toArray()
    const defaultInitialOperationIndex = sourceEntries.length - 1
    this.initialOperationIndex =
      config.initialOperationIndex !== undefined
        ? Math.min(config.initialOperationIndex, defaultInitialOperationIndex)
        : defaultInitialOperationIndex
    const initialEntries =
      this.initialOperationIndex >= 0 ? sourceEntries.slice(0, this.initialOperationIndex + 1) : []
    this.operationLog = new OperationLog(initialEntries)

    const defaultSpeed = config.playbackOptions?.defaultSpeed ?? 1
    const autoPlay = config.playbackOptions?.autoPlay ?? false

    this.stateValue = reactive({
      snapshot: undefined,
      previousSnapshot: undefined,
      lastResolvedEntry: undefined,
      actionLogLength: 0,
      executedIndex: -1,
      playback: {
        status: 'idle',
        speed: defaultSpeed,
        autoPlay,
        queue: [],
        current: undefined,
      },
      input: {
        locked: false,
        queued: [],
      },
    }) as unknown as BattleViewState

    this.stateProxy = readonly(this.stateValue) as Readonly<BattleViewState>
  }

  private executeOperationWithRunner(
    operation: OperationLogEntry,
    options: { operationIndex?: number; operationLog?: OperationLog } = {},
  ): void {
    const runner = this.operationRunner
    const battle = this.battleInstance
    if (!runner || !battle) {
      throw new Error('OperationRunner is not initialized')
    }

    const sourceLog = options.operationLog ?? this.operationLog
    switch (operation.type) {
      case 'play-card': {
        const cardId = sourceLog.resolveValue(operation.card, battle)
        const resolvedOperations =
          operation.operations?.map((op) => ({
            type: op.type,
            payload:
              op.payload === undefined ? undefined : sourceLog.resolveValue(op.payload, battle),
          })) ?? undefined
        runner.playCard(cardId, resolvedOperations)
        break
      }
      case 'end-player-turn': {
        runner.endPlayerTurn()
        break
      }
      default: {
        const exhaustiveCheck: never = operation
        throw new Error(`Unsupported operation type: ${(exhaustiveCheck as { type: string }).type}`)
      }
    }

    if (typeof options.operationIndex === 'number') {
      this.executedOperationIndex = options.operationIndex
    }
  }

  private syncStateFromBattle(): void {
    const battle = this.battleInstance
    this.stateValue.previousSnapshot = this.stateValue.snapshot

    if (!battle) {
      this.stateValue.snapshot = undefined
      this.stateValue.lastResolvedEntry = undefined
      this.stateValue.actionLogLength = this.actionLog.length
      this.stateValue.executedIndex = this.actionLog.length - 1
      this.notifyState()
      return
    }

    this.stateValue.snapshot = battle.getSnapshot()
    const lastEntry = this.actionLog.at(this.actionLog.length - 1)
    this.stateValue.lastResolvedEntry = lastEntry ? this.resolveActionLogEntry(lastEntry, battle) : undefined
    this.stateValue.actionLogLength = this.actionLog.length
    this.stateValue.executedIndex = this.actionLog.length - 1
    this.notifyState()
  }

  get state(): Readonly<BattleViewState> {
    return this.stateProxy
  }

  get battle(): Battle | undefined {
    return this.battleInstance
  }

  getActionLog(): ActionLog {
    return this.actionLog
  }

  subscribe(listener: ViewManagerEventListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitializing) {
      return
    }

    this.isInitializing = true
    this.stateValue.playback.status = 'initializing'
    this.setInputLock(true, { silent: true })
    this.notifyState()

    try {
      this.rebuildFromOperations(this.initialOperationIndex)
      this.stateValue.playback.status = 'idle'
      this.setInputLock(false, { silent: true })
      this.notifyState()
      this.emit({ type: 'initialized', state: this.stateProxy })
    } catch (unknownError) {
      const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError))
      this.stateValue.playback.status = 'idle'
      this.setInputLock(false, { silent: true })
      this.notifyState()
      this.emit({ type: 'error', error })
      throw error
    } finally {
      this.isInitializing = false
    }
  }

  setPlaybackSpeed(multiplier: number): void {
    if (!Number.isFinite(multiplier) || multiplier <= 0) {
      throw new Error('Playback speed multiplier must be a positive finite number')
    }

    this.stateValue.playback.speed = multiplier
    this.notifyState()
  }

  toggleAutoPlay(enabled: boolean): void {
    this.stateValue.playback.autoPlay = enabled
    this.notifyState()
  }

  canRetry(): boolean {
    return true
  }

  hasUndoableAction(): boolean {
    return this.operationLog.length - 1 > this.initialOperationIndex
  }

  resetToInitialState(): void {
    this.operationLog.truncateAfter(this.initialOperationIndex)
    this.rebuildFromOperations(this.initialOperationIndex)
  }

  undoLastPlayerAction(): boolean {
    const lastIndex = this.operationLog.length - 1
    if (lastIndex <= this.initialOperationIndex) {
      return false
    }

    this.operationLog.truncateAfter(lastIndex - 1)
    this.rebuildFromOperations(lastIndex - 1)
    return true
  }

  queuePlayerAction(input: PlayerInput): void {
    this.stateValue.input.queued.push(input)
    this.notifyState()
    void this.processInputQueue()
  }

  consumeNextPlayerAction(): PlayerInput | undefined {
    const next = this.stateValue.input.queued.shift()
    if (next !== undefined) {
      this.notifyState()
    }
    return next
  }

  clearQueuedPlayerActions(): PlayerInput[] {
    const queued = [...this.stateValue.input.queued]
    this.stateValue.input.queued.length = 0
    if (queued.length > 0) {
      this.notifyState()
    }
    return queued
  }

  enqueueAnimation(scriptInput: AnimationScriptInput): string {
    const script = this.normalizeAnimationScript(scriptInput)
    this.stateValue.playback.queue.push(script)
    this.notifyState()
    this.startNextAnimation()
    return script.id
  }

  applyAnimationCommand(command: AnimationCommand): void {
    let stateChanged = false

    switch (command.type) {
      case 'update-snapshot': {
        this.stateValue.previousSnapshot = this.stateValue.snapshot
        this.stateValue.snapshot = command.snapshot
        this.stateValue.lastResolvedEntry = command.resolvedEntry ?? this.stateValue.lastResolvedEntry
        stateChanged = true
        break
      }
      case 'set-input-lock': {
        this.setInputLock(command.locked)
        stateChanged = true
        break
      }
      default:
        break
    }

    if (stateChanged) {
      this.notifyState()
    }
  }

  applyAnimationCommands(commands: AnimationCommand[]): void {
    for (const command of commands) {
      this.applyAnimationCommand(command)
    }
  }

  completeCurrentAnimation(scriptId: string): void {
    const current = this.stateValue.playback.current
    if (!current || current.script.id !== scriptId) {
      throw new Error('指定されたアニメーションは再生中ではありません。')
    }

    const completedScript = current.script
    this.stateValue.executedIndex = Math.max(this.stateValue.executedIndex, completedScript.entryIndex)
    if (completedScript.resolvedEntry) {
      this.stateValue.lastResolvedEntry = completedScript.resolvedEntry
    }

    this.stateValue.playback.current = undefined

    if (this.stateValue.playback.queue.length === 0) {
      this.stateValue.playback.status = 'idle'
      this.setInputLock(false)
    }

    this.notifyState()
    this.emit({ type: 'animation-complete', script: completedScript })

    if (this.stateValue.playback.queue.length > 0) {
      this.startNextAnimation()
    }
  }

  private async processInputQueue(): Promise<void> {
    if (this.isProcessingInputQueue) {
      return
    }

    this.isProcessingInputQueue = true

    try {
      while (this.stateValue.input.queued.length > 0) {
        const nextInput = this.stateValue.input.queued[0]!
        try {
          this.applyPlayerInput(nextInput)
        } catch (unknownError) {
          const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError))
          this.emit({ type: 'error', error })
          break
        }
      }
    } finally {
      this.isProcessingInputQueue = false
    }
  }

  private applyPlayerInput(input: PlayerInput): void {
    const operation = this.convertInputToOperation(input)
    this.stateValue.input.queued.shift()
    this.notifyState()

    if (!operation) {
      return
    }

    try {
      this.applyOperation(operation)
    } catch (error) {
      throw error instanceof Error ? error : new Error(String(error))
    }
  }

  private convertInputToOperation(input: PlayerInput): OperationLogEntry | null {
    switch (input.type) {
      case 'play-card':
        return {
          type: 'play-card',
          card: input.cardId,
          operations: input.operations?.map((operation) => ({
            type: operation.type,
            payload: operation.payload,
          })),
        }
      case 'end-player-turn':
        return { type: 'end-player-turn' }
      case 'start-battle':
      case 'custom':
        return null
      default:
        throw new Error(`Unsupported player input type: ${(input as { type: string }).type}`)
    }
  }

  private applyOperation(operation: OperationLogEntry): void {
    const operationIndex = this.operationLog.push(operation)
    try {
      if (!this.operationRunner) {
        this.rebuildFromOperations(operationIndex)
        return
      }
      this.executeOperationWithRunner(operation, { operationIndex })
      this.syncStateFromBattle()
    } catch (error) {
      this.operationLog.truncateAfter(operationIndex - 1)
      this.rebuildFromOperations(this.operationLog.length - 1)
      throw error
    }
  }

  private rebuildFromOperations(targetOperationIndex: number): void {
    const clampedIndex =
      this.operationLog.length === 0 ? -1 : Math.min(targetOperationIndex, this.operationLog.length - 1)

    this.suspendRunnerEvents = true
    try {
      const battle = this.createBattle()
      const actionLog = new ActionLog()
      const runner = new OperationRunner({
        battle,
        actionLog,
        onEntryAppended: (entry, context) => this.handleRunnerEntryAppended(entry, context),
      })

      this.battleInstance = battle
      this.actionLog = actionLog
      this.operationRunner = runner

      runner.initializeIfNeeded()

      for (let index = 0; index <= clampedIndex; index += 1) {
        const operation = this.operationLog.at(index)
        if (!operation) {
          continue
        }
        this.executeOperationWithRunner(operation, { operationIndex: index })
      }

      this.executedOperationIndex = clampedIndex
    } catch (error) {
      this.operationRunner = undefined
      this.battleInstance = undefined
      this.actionLog = new ActionLog()
      if (error instanceof OperationRunnableError) {
        throw error
      }
      throw error instanceof Error ? error : new Error(String(error))
    } finally {
      this.suspendRunnerEvents = false
    }

    this.stateValue.playback.queue.length = 0
    this.stateValue.playback.current = undefined
    this.stateValue.playback.status = 'idle'
    this.setInputLock(false, { silent: true })
    this.stateValue.input.queued.length = 0

    this.syncStateFromBattle()
  }

  private resolveActionLogEntry(
    entry: BattleActionLogEntry,
    battle: Battle,
  ): ResolvedBattleActionLogEntry | undefined {
    switch (entry.type) {
      case 'battle-start':
        return entry
      case 'start-player-turn':
        return { ...entry }
      case 'play-card':
        return this.resolvePlayCardEntry(entry, battle)
      case 'end-player-turn':
        return { type: 'end-player-turn' }
      case 'victory':
      case 'gameover':
        return { type: entry.type }
      default:
        return undefined
    }
  }

  private resolvePlayCardEntry(
    entry: Extract<BattleActionLogEntry, { type: 'play-card' }>,
    battle: Battle,
  ): ResolvedBattleActionLogEntry {
    const cardId = this.actionLog.resolveValue(entry.card, battle)

    const resolved: {
      targetEnemyId?: number
      targetEnemy?: EnemySummary
      selectedHandCardId?: number
      selectedHandCard?: CardSummary
      operations: ResolvedPlayCardOperation[]
    } = {
      operations: [],
    }

    const operations = entry.operations ?? []
    for (const operation of operations) {
      const payload =
        operation.payload === undefined ? undefined : this.actionLog.resolveValue(operation.payload, battle)

      switch (operation.type) {
        case 'target-enemy': {
          const enemyId = this.extractEnemyId(payload)
          const enemy = battle.enemyTeam.findEnemy(enemyId)
          const summary = enemy ? this.summarizeEnemy(enemy) : undefined
          resolved.targetEnemyId = enemyId
          resolved.targetEnemy = summary
          resolved.operations.push({
            type: 'target-enemy',
            enemyId,
            enemy: summary,
          })
          break
        }
        case 'select-hand-card': {
          const selectedId = this.extractCardId(payload)
          const located = battle.cardRepository.findWithLocation(selectedId)
          const summary = located ? this.summarizeCard(located.card) : undefined
          resolved.selectedHandCardId = selectedId
          resolved.selectedHandCard = summary
          resolved.operations.push({
            type: 'select-hand-card',
            cardId: selectedId,
            card: summary,
          })
          break
        }
        default: {
          resolved.operations.push({
            type: operation.type,
            payload,
          })
        }
      }
    }

    return {
      type: 'play-card',
      cardId,
      operations: resolved.operations,
      targetEnemyId: resolved.targetEnemyId,
      targetEnemy: resolved.targetEnemy,
      selectedHandCardId: resolved.selectedHandCardId,
      selectedHandCard: resolved.selectedHandCard,
    }
  }

  private extractEnemyId(payload: unknown): number {
    if (typeof payload === 'number' && Number.isInteger(payload) && payload >= 0) {
      return payload
    }

    if (typeof payload === 'object' && payload !== null) {
      const candidate =
        (payload as { enemyId?: number }).enemyId ??
        (payload as { targetEnemyId?: number }).targetEnemyId
      if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 0) {
        return candidate
      }
    }

    throw new Error('Resolved operation is missing a valid enemy id')
  }

  private extractCardId(payload: unknown): number {
    if (typeof payload === 'number' && Number.isInteger(payload) && payload >= 0) {
      return payload
    }

    if (typeof payload === 'object' && payload !== null) {
      const candidate =
        (payload as { cardId?: number }).cardId ??
        (payload as { selectedHandCardId?: number }).selectedHandCardId
      if (typeof candidate === 'number' && Number.isInteger(candidate) && candidate >= 0) {
        return candidate
      }
    }

    throw new Error('Resolved operation is missing a valid card id')
  }

  private summarizeEnemy(enemy: Enemy): EnemySummary | undefined {
    const id = enemy.id
    if (id === undefined) {
      return undefined
    }

    return {
      id,
      name: enemy.name,
      currentHp: enemy.currentHp,
      maxHp: enemy.maxHp,
    }
  }

  private summarizeCard(card: Card): CardSummary | undefined {
    const id = card.id
    if (id === undefined) {
      return undefined
    }

    return {
      id,
      title: card.title,
      type: card.type,
    }
  }

  private normalizeAnimationScript(script: AnimationScriptInput): AnimationScript {
    const id = script.id ?? this.generateAnimationId()
    return {
      id,
      entryIndex: script.entryIndex,
      commands: script.commands,
      resolvedEntry: script.resolvedEntry,
      metadata: script.metadata,
    }
  }

  private generateAnimationId(): string {
    this.animationSequence += 1
    return `animation-script-${this.animationSequence}`
  }

  private handleRunnerEntryAppended(entry: BattleActionLogEntry, _context: EntryAppendContext): void {
    if (this.suspendRunnerEvents) {
      return
    }

    const battle = this.battleInstance
    if (!battle) {
      return
    }

    this.stateValue.lastResolvedEntry = this.resolveActionLogEntry(entry, battle) ?? this.stateValue.lastResolvedEntry
    this.stateValue.actionLogLength = this.actionLog.length
  }

  private startNextAnimation(): void {
    if (this.stateValue.playback.current) {
      return
    }

    const next = this.stateValue.playback.queue.shift()
    if (!next) {
      if (this.stateValue.playback.status !== 'idle') {
        this.stateValue.playback.status = 'idle'
        this.setInputLock(false)
        this.notifyState()
      }
      return
    }

    this.stateValue.playback.current = {
      script: next,
      startedAt: Date.now(),
    }
    this.stateValue.playback.status = 'playing'
    this.setInputLock(true)
    this.notifyState()
    this.emit({ type: 'animation-start', script: next })
  }

  private setInputLock(locked: boolean, options: { silent?: boolean } = {}): void {
    if (this.stateValue.input.locked === locked) {
      return
    }

    this.stateValue.input.locked = locked
    if (!options.silent) {
      this.emit({ type: 'input-lock-changed', locked })
    }
  }

  private notifyState(): void {
    this.emit({ type: 'state', state: this.stateProxy })
  }

  private emit(event: ViewManagerEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}
