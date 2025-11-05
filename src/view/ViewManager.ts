import { reactive, readonly } from 'vue'
import { ActionLog, type BattleActionLogEntry } from '@/domain/battle/ActionLog'
import {
  ActionLogReplayer,
  type ResolvedBattleActionLogEntry,
  type ResolvedPlayCardOperation,
  type EnemySummary,
  type CardSummary,
} from '@/domain/battle/ActionLogReplayer'
import type { Battle, BattleSnapshot } from '@/domain/battle/Battle'
import type { CardOperation } from '@/domain/entities/operations'
import type { Enemy } from '@/domain/entities/Enemy'
import type { Card } from '@/domain/entities/Card'

export interface ViewManagerConfig {
  createBattle: () => Battle
  actionLog?: ActionLog
  playbackOptions?: {
    defaultSpeed?: number
    autoPlay?: boolean
  }
  initialActionLogIndex?: number
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
  private readonly actionLog: ActionLog
  private readonly stateValue: BattleViewState
  private readonly stateProxy: Readonly<BattleViewState>
  private readonly listeners = new Set<ViewManagerEventListener>()
  private readonly initialActionLogIndex: number
  private animationSequence = 0
  private isProcessingInputQueue = false
  private initialExecutedIndex = -1
  private playerActionHistory: number[] = []

  private battleInstance?: Battle
  private isInitializing = false

  constructor(config: ViewManagerConfig) {
    this.createBattle = config.createBattle
    const sourceActionLog = config.actionLog ?? new ActionLog()
    this.actionLog = new ActionLog(sourceActionLog.toArray())
    this.initialActionLogIndex = config.initialActionLogIndex ?? -1

    const defaultSpeed = config.playbackOptions?.defaultSpeed ?? 1
    const autoPlay = config.playbackOptions?.autoPlay ?? false
    const normalizedInitialIndex = Math.max(-1, this.initialActionLogIndex)
    const executedIndex =
      this.actionLog.length === 0
        ? -1
        : normalizedInitialIndex >= 0
          ? Math.min(normalizedInitialIndex, this.actionLog.length - 1)
          : -1

    this.stateValue = reactive({
      snapshot: undefined,
      previousSnapshot: undefined,
      lastResolvedEntry: undefined,
      actionLogLength: this.actionLog.length,
      executedIndex,
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
      const replayer = new ActionLogReplayer({
        createBattle: this.createBattle,
        actionLog: this.actionLog,
      })

      const normalizedInitialIndex = Math.max(-1, this.initialActionLogIndex)
      const targetIndex =
        this.actionLog.length === 0
          ? -1
          : Math.min(normalizedInitialIndex, this.actionLog.length - 1)
      const effectiveIndex = Number.isFinite(targetIndex) ? targetIndex : -1

      const result = replayer.run(effectiveIndex)

      this.actionLog.truncateAfter(effectiveIndex)
      this.rebuildPlayerActionHistory(effectiveIndex)

      this.battleInstance = result.battle
      this.stateValue.previousSnapshot = result.initialSnapshot
      this.stateValue.snapshot = result.snapshot
      this.stateValue.lastResolvedEntry = result.lastEntry
      this.stateValue.actionLogLength = this.actionLog.length
      this.stateValue.executedIndex = effectiveIndex
      this.stateValue.playback.status = 'idle'
      this.setInputLock(false, { silent: true })
      void this.processInputQueue()

      this.initialExecutedIndex = effectiveIndex

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
    return this.stateValue.executedIndex !== this.initialExecutedIndex
  }

  hasUndoableAction(): boolean {
    // Reference reactive state to ensure Vue reactivity tracks changes
    const executedIndex = this.stateValue.executedIndex
    void this.stateValue.actionLogLength
    const lastActionIndex = this.playerActionHistory[this.playerActionHistory.length - 1]
    return (
      lastActionIndex !== undefined &&
      lastActionIndex > this.initialExecutedIndex &&
      executedIndex >= lastActionIndex
    )
  }

  resetToInitialState(): void {
    const targetIndex = this.initialExecutedIndex
    this.actionLog.truncateAfter(targetIndex)
    this.rebuildPlayerActionHistory(targetIndex)
    this.reloadBattleAt(targetIndex)
  }

  undoLastPlayerAction(): boolean {
    const lastActionIndex = this.playerActionHistory[this.playerActionHistory.length - 1]
    if (lastActionIndex === undefined || lastActionIndex <= this.initialExecutedIndex) {
      return false
    }

    this.playerActionHistory.pop()

    const truncateIndex = lastActionIndex - 1
    this.actionLog.truncateAfter(truncateIndex)
    this.trimPlayerActionHistory(truncateIndex)
    this.reloadBattleAt(truncateIndex)
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

  private async processInputQueue(): Promise<void> {
    if (this.isProcessingInputQueue) {
      return
    }

    if (!this.battleInstance) {
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
    const battle = this.battleInstance
    if (!battle) {
      throw new Error('Battle is not initialized')
    }

    this.stateValue.input.queued.shift()
    this.notifyState()

    switch (input.type) {
      case 'play-card': {
        const operations = input.operations?.map((operation) => ({
          type: operation.type,
          payload: operation.payload,
        }))
        this.appendActionLogEntry(
          {
            type: 'play-card',
            card: input.cardId,
            operations,
          },
          { playerAction: true },
        )
        break
      }
      case 'end-player-turn': {
        this.resolveEndPlayerTurnSequence()
        break
      }
      case 'start-battle': {
        this.appendActionLogEntry({ type: 'battle-start' })
        break
      }
      case 'custom': {
        return
      }
      default:
        throw new Error(`Unsupported player input type: ${(input as { type: string }).type}`)
    }

  }

  private updateSnapshotFromBattle(entryIndex: number): void {
    const battle = this.battleInstance
    if (!battle) {
      return
    }

    const snapshot = battle.getSnapshot()
    const entry = this.actionLog.at(entryIndex)
    const resolved = entry ? this.resolveActionLogEntry(entry, battle) : undefined

    this.stateValue.previousSnapshot = this.stateValue.snapshot
    this.stateValue.snapshot = snapshot
    this.stateValue.lastResolvedEntry = resolved
    this.stateValue.actionLogLength = this.actionLog.length
    this.stateValue.executedIndex = entryIndex

    this.notifyState()
  }

  private appendActionLogEntry(
    entry: BattleActionLogEntry,
    options: { playerAction?: boolean } = {},
  ): number {
    const battle = this.battleInstance
    if (!battle) {
      throw new Error('Battle is not initialized')
    }

    const index = this.actionLog.push(entry)
    battle.executeActionLog(this.actionLog, index)
    this.updateSnapshotFromBattle(index)
    if (options.playerAction) {
      this.playerActionHistory.push(index)
    }
    return index
  }

  private resolveEndPlayerTurnSequence(): void {
    const battle = this.battleInstance
    if (!battle) {
      return
    }

    this.appendActionLogEntry({ type: 'end-player-turn' }, { playerAction: true })

    const desiredHandSize = 5
    const currentHandSize = battle.hand.list().length
    const drawCount = Math.max(0, desiredHandSize - currentHandSize)

    this.appendActionLogEntry({
      type: 'start-player-turn',
      draw: drawCount > 0 ? drawCount : undefined,
    })
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

  private reloadBattleAt(targetIndex: number): void {
    const previousSnapshot = this.stateValue.snapshot
    const normalizedIndex =
      this.actionLog.length === 0 ? -1 : Math.min(targetIndex, this.actionLog.length - 1)
    const replayer = new ActionLogReplayer({
      createBattle: this.createBattle,
      actionLog: this.actionLog,
    })
    const result = replayer.run(normalizedIndex)

    this.battleInstance = result.battle
    this.stateValue.previousSnapshot = previousSnapshot
    this.stateValue.snapshot = result.snapshot
    this.stateValue.lastResolvedEntry = result.lastEntry
    this.stateValue.actionLogLength = this.actionLog.length
    this.stateValue.executedIndex = normalizedIndex
    this.stateValue.playback.queue.length = 0
    this.stateValue.playback.current = undefined
    this.stateValue.playback.status = 'idle'
    this.stateValue.input.locked = false
    this.stateValue.input.queued.length = 0

    this.notifyState()
    this.emit({ type: 'state', state: this.stateProxy })
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
        return this.resolveEndPlayerTurnEntry(battle)
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

  private resolveEndPlayerTurnEntry(battle: Battle): ResolvedBattleActionLogEntry {
    const summary = battle.getLastEnemyTurnSummary()
    return {
      type: 'end-player-turn',
      enemyActions: summary?.actions ?? [],
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

  private isPlayerActionEntry(entry: BattleActionLogEntry): boolean {
    return entry.type === 'play-card' || entry.type === 'end-player-turn'
  }

  private trimPlayerActionHistory(upToIndex: number): void {
    this.playerActionHistory = this.playerActionHistory.filter((index) => index <= upToIndex)
  }

  private rebuildPlayerActionHistory(upToIndex: number): void {
    if (upToIndex < 0) {
      this.playerActionHistory = []
      return
    }

    const history: number[] = []
    for (let index = 0; index <= upToIndex; index += 1) {
      const entry = this.actionLog.at(index)
      if (entry && this.isPlayerActionEntry(entry)) {
        history.push(index)
      }
    }
    this.playerActionHistory = history
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
