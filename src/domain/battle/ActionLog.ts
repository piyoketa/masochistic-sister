import type { CardOperation } from '../entities/operations'
import type {
  Battle,
  BattleSnapshot,
  EnemyTurnActionSummary,
  InterruptEnemyActionTrigger,
} from './Battle'
import type { DamageOutcome } from '../entities/Damages'

type ValueFactory<T> = T | ((battle: Battle) => T)

type SnapshotPatch<T> = T extends Array<infer U>
  ? U[]
  : T extends object
    ? { [K in keyof T]?: SnapshotPatch<T[K]> }
    : T

export interface BattleSnapshotPatch {
  changes: SnapshotPatch<BattleSnapshot>
  uiHints?: Record<string, unknown>
}

export interface AnimationInstruction {
  waitMs: number
  metadata?: AnimationStageMetadata
}

export interface AnimationBatch {
  batchId: string
  snapshot: BattleSnapshot
  patch?: BattleSnapshotPatch
  instructions: AnimationInstruction[]
}

export type AnimationStageMetadata =
  | { stage: 'battle-start' }
  | { stage: 'turn-start' }
  | { stage: 'turn-end' }
  | { stage: 'victory' }
  | { stage: 'gameover' }
  | { stage: 'card-trash'; cardIds: number[]; cardTitles?: string[] }
  | { stage: 'card-eliminate'; cardIds: number[]; cardTitles?: string[] }
  | { stage: 'deck-draw'; cardIds: number[]; durationMs?: number; draw?: number; handOverflow?: boolean }
  | { stage: 'mana'; amount?: number; eventId?: string }
  | {
      stage: 'escape'
      subject: 'player' | 'enemy'
      subjectId?: number
      stateId: string
      payload?: unknown
    }
  | { stage: 'enemy-highlight'; enemyId: number; actionName?: string; skipped: boolean }
  | { stage: 'already-acted-enemy'; enemyId: number }
  | {
      stage: 'create-state-card'
      durationMs?: number
      stateId?: string
      stateName?: string
      cardId?: number
      cardIds?: number[]
      cardTitle?: string
      cardTitles?: string[]
      cardCount?: number
      enemyId?: number | null
    }
  | {
      stage: 'memory-card'
      durationMs?: number
      stateId?: string
      stateName?: string
      cardId?: number
      cardIds?: number[]
      cardTitle?: string
      cardTitles?: string[]
      cardCount?: number
      enemyId?: number | null
      soundId?: string
    }
  | {
      stage: 'enemy-damage'
      cardId?: number
      cardTitle?: string
      enemyId?: number
      damageOutcomes?: readonly DamageOutcome[]
    }
  | {
      stage: 'player-damage'
      enemyId?: number | null
      actionName?: string
      cardId?: number
      cardTitle?: string
      damageOutcomes?: readonly DamageOutcome[]
    }
  | { stage: 'audio'; soundId: string; durationMs?: number }
  | { stage: 'cutin'; src: string; durationMs?: number }
  | { stage: 'defeat'; defeatedEnemyIds: number[]; cardId?: number; cardTitle?: string }

export type EnemyActEntryMetadata = Omit<EnemyTurnActionSummary, 'snapshotAfter'> & {
  interruptTrigger?: InterruptEnemyActionTrigger
  interruptMetadata?: Record<string, unknown>
}

type BaseActionLogEntry = {
  animationBatches?: AnimationBatch[]
  postEntrySnapshot?: BattleSnapshot
  getAnimationTotalWaitMs?: () => number
}

export type BattleActionLogEntry =
  | ({ type: 'battle-start' } & BaseActionLogEntry)
  | ({ type: 'start-player-turn'; draw?: number } & BaseActionLogEntry)
  | ({
      type: 'play-card'
      card: ValueFactory<number>
      operations?: Array<{
        type: CardOperation['type']
        payload?: ValueFactory<CardOperation['payload']>
      }>
    } & BaseActionLogEntry)
  | ({
      type: 'player-event'
      eventId: string
      payload?: unknown
    } & BaseActionLogEntry)
  | ({
      type: 'enemy-act'
      enemyId: number
      actionName?: string
      metadata?: EnemyActEntryMetadata
    } & BaseActionLogEntry)
  | ({
      type: 'state-event'
      subject: 'player' | 'enemy'
      subjectId?: number
      stateId: string
      payload?: unknown
    } & BaseActionLogEntry)
  | ({ type: 'end-player-turn' } & BaseActionLogEntry)
  | ({ type: 'victory' } & BaseActionLogEntry)
  | ({ type: 'gameover' } & BaseActionLogEntry)

export class ActionLog {
  private readonly entries: BattleActionLogEntry[] = []

  constructor(initialEntries?: BattleActionLogEntry[]) {
    if (initialEntries) {
      initialEntries.forEach((entry) => this.push(entry))
    }
  }

  push(entry: BattleActionLogEntry): number {
    this.entries.push(this.enhanceEntry(entry))
    return this.entries.length - 1
  }

  at(index: number): BattleActionLogEntry | undefined {
    return this.entries[index]
  }

  toArray(): BattleActionLogEntry[] {
    return [...this.entries]
  }

  slice(endInclusive: number): BattleActionLogEntry[] {
    if (endInclusive < 0) {
      return []
    }

    return this.entries.slice(0, endInclusive + 1)
  }

  truncateAfter(index: number): void {
    const keepLength = index >= 0 ? index + 1 : 0
    if (keepLength >= this.entries.length) {
      return
    }

    if (keepLength <= 0) {
      this.entries.length = 0
      return
    }

    this.entries.length = keepLength
  }

  get length(): number {
    return this.entries.length
  }

  private enhanceEntry<T extends BattleActionLogEntry>(entry: T): T {
    const enhanced = entry
    enhanced.getAnimationTotalWaitMs = () => {
      const batches = enhanced.animationBatches ?? []
      const total = batches.reduce((sum, batch) => sum + this.calculateBatchWait(batch), 0)
      if (enhanced.type === 'enemy-act') {
        return Math.max(total, 500)
      }
      return total
    }
    return enhanced
  }

  resolveValue<T>(value: ValueFactory<T>, battle: Battle): T {
    if (typeof value === 'function') {
      return (value as (context: Battle) => T)(battle)
    }

    return value
  }

  private calculateBatchWait(batch: AnimationBatch): number {
    if (!batch.instructions || batch.instructions.length === 0) {
      return 0
    }
    return batch.instructions.reduce((max, instruction) => Math.max(max, Math.max(0, instruction.waitMs)), 0)
  }
}

export type { ValueFactory }
