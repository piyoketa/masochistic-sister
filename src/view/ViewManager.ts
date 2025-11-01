import { reactive, readonly } from 'vue'
import { ActionLog } from '@/domain/battle/ActionLog'
import { ActionLogReplayer, type ResolvedBattleActionLogEntry } from '@/domain/battle/ActionLogReplayer'
import type { Battle, BattleSnapshot } from '@/domain/battle/Battle'

export interface ViewManagerConfig {
  createBattle: () => Battle
  actionLog?: ActionLog
  playbackOptions?: {
    defaultSpeed?: number
    autoPlay?: boolean
  }
  initialActionLogIndex?: number
}

export type ViewManagerEvent =
  | { type: 'state'; state: Readonly<BattleViewState> }
  | { type: 'initialized'; state: Readonly<BattleViewState> }
  | { type: 'error'; error: Error }

export type ViewManagerEventListener = (event: ViewManagerEvent) => void

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
  }
  input: {
    locked: boolean
    queued: unknown[]
  }
}

export class ViewManager {
  private readonly createBattle: () => Battle
  private readonly actionLog: ActionLog
  private readonly stateValue: BattleViewState
  private readonly stateProxy: Readonly<BattleViewState>
  private readonly listeners = new Set<ViewManagerEventListener>()
  private readonly initialActionLogIndex: number

  private battleInstance?: Battle
  private isInitializing = false

  constructor(config: ViewManagerConfig) {
    this.createBattle = config.createBattle
    this.actionLog = config.actionLog ?? new ActionLog()
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

    this.stateValue = reactive<BattleViewState>({
      snapshot: undefined,
      previousSnapshot: undefined,
      lastResolvedEntry: undefined,
      actionLogLength: this.actionLog.length,
      executedIndex,
      playback: {
        status: 'idle',
        speed: defaultSpeed,
        autoPlay,
      },
      input: {
        locked: false,
        queued: [],
      },
    })

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
    this.stateValue.input.locked = true
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

      this.battleInstance = result.battle
      this.stateValue.previousSnapshot = result.initialSnapshot
      this.stateValue.snapshot = result.snapshot
      this.stateValue.lastResolvedEntry = result.lastEntry
      this.stateValue.actionLogLength = this.actionLog.length
      this.stateValue.executedIndex = effectiveIndex
      this.stateValue.playback.status = 'idle'
      this.stateValue.input.locked = false

      this.notifyState()
      this.emit({ type: 'initialized', state: this.stateProxy })
    } catch (unknownError) {
      const error = unknownError instanceof Error ? unknownError : new Error(String(unknownError))
      this.stateValue.playback.status = 'idle'
      this.stateValue.input.locked = false
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

  private notifyState(): void {
    this.emit({ type: 'state', state: this.stateProxy })
  }

  private emit(event: ViewManagerEvent): void {
    for (const listener of this.listeners) {
      listener(event)
    }
  }
}
