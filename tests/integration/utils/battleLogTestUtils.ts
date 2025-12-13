import type {
  AnimationBatch,
  AnimationInstruction,
  BattleActionLogEntry,
  BattleSnapshotPatch,
  ValueFactory,
} from '@/domain/battle/ActionLog'
import { OperationLog } from '@/domain/battle/OperationLog'
import type { CardOperation } from '@/domain/entities/operations'
import type { BattleSnapshot } from '@/domain/battle/Battle'

export type OperationLogEntryConfig = Parameters<OperationLog['push']>[0]

export interface AnimationBatchInstructionSummary {
  waitMs: number
  metadata?: AnimationInstruction['metadata'] | unknown
}

export interface AnimationBatchSummary {
  batchId: string
  snapshot: unknown
  patch?: BattleSnapshotPatch | unknown
  instructions: AnimationBatchInstructionSummary[]
}

export interface ActionLogEntrySummary {
  type: BattleActionLogEntry['type']
  card?: number | ValueFactory<number>
  operations?: CardOperation[]
  animationBatches?: AnimationBatchSummary[]
  eventId?: string
  animations?: Array<{
    batchId?: string
    waitMs: number
    metadata?: AnimationInstruction['metadata'] | unknown
    snapshot?: unknown
  }>
}

export function summarizeActionLogEntry(entry: BattleActionLogEntry): ActionLogEntrySummary {
  const summary: ActionLogEntrySummary = {
    type: entry.type,
  }
  if ('card' in entry && entry.card !== undefined) {
    summary.card = entry.card
  }
  if ('operations' in entry && entry.operations !== undefined) {
    summary.operations = entry.operations
  }
  if (entry.type === 'player-event') {
    summary.eventId = entry.eventId
  }
  const animationBatches = summarizeAnimationBatches(entry.animationBatches ?? [])
  if (animationBatches.length > 0) {
    summary.animationBatches = animationBatches
  }
  return summary
}

export function buildOperationLog(entries: OperationLogEntryConfig[], inclusiveIndex: number): OperationLog {
  const log = new OperationLog()
  entries.slice(0, inclusiveIndex + 1).forEach((entry) => log.push(entry))
  return log
}

function summarizeAnimationBatches(batches: AnimationBatch[]): AnimationBatchSummary[] {
  return batches.map((batch) => ({
    batchId: batch.batchId,
    snapshot: stripRelics(deepClone(batch.snapshot)),
    patch: batch.patch ? deepClone(batch.patch) : undefined,
    instructions: (batch.instructions ?? []).map((instruction) => ({
      waitMs: instruction.waitMs,
      metadata: deepClone(instruction.metadata),
    })),
  }))
}

function stripRelics(snapshot: unknown): unknown {
  if (
    snapshot &&
    typeof snapshot === 'object' &&
    'player' in (snapshot as Record<string, unknown>) &&
    (snapshot as { player?: { relics?: unknown } }).player
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (snapshot as any).player.relics
  }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (snapshot as any).turnPosition
    const enemies = (snapshot as any).enemies
    if (Array.isArray(enemies)) {
      enemies.forEach((enemy) => {
        if (enemy && typeof enemy === 'object') {
          delete (enemy as any).nextActions
        }
      })
    }
  }
  return snapshot
}

function deepClone<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }
  return JSON.parse(JSON.stringify(value)) as T
}
