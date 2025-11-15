import type {
  AnimationBatch,
  AnimationInstruction,
  BattleActionLogEntry,
  ValueFactory,
} from '@/domain/battle/ActionLog'
import { OperationLog } from '@/domain/battle/OperationLog'
import type { CardOperation } from '@/domain/entities/operations'
import type { BattleSnapshot } from '@/domain/battle/Battle'

export type OperationLogEntryConfig = Parameters<OperationLog['push']>[0]

export interface AnimationBatchInstructionSummary {
  waitMs: number
  metadata?: AnimationInstruction['metadata']
}

export interface AnimationBatchSummary {
  batchId: string
  snapshot: unknown
  instructions: AnimationBatchInstructionSummary[]
}

export interface AnimationInstructionSummary extends AnimationBatchInstructionSummary {
  batchId: string
  snapshot: unknown
}

export interface ActionLogEntrySummary {
  type: BattleActionLogEntry['type']
  card?: number | ValueFactory<number>
  operations?: CardOperation[]
  animationBatches?: AnimationBatchSummary[]
  animations?: AnimationInstructionSummary[]
  eventId?: string
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
    summary.animations = flattenAnimationBatches(animationBatches)
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
    snapshot: deepClone(batch.snapshot),
    instructions: (batch.instructions ?? []).map((instruction) => ({
      waitMs: instruction.waitMs,
      metadata: deepClone(instruction.metadata),
    })),
  }))
}

function flattenAnimationBatches(batches: AnimationBatchSummary[]): AnimationInstructionSummary[] {
  return batches.flatMap((batch) =>
    batch.instructions.map((instruction) => ({
      ...instruction,
      batchId: batch.batchId,
      snapshot: batch.snapshot,
    })),
  )
}

function deepClone<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }
  return JSON.parse(JSON.stringify(value)) as T
}
