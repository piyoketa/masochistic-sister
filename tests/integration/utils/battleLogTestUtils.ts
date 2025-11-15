import type { BattleActionLogEntry, ValueFactory } from '@/domain/battle/ActionLog'
import { OperationLog } from '@/domain/battle/OperationLog'
import type { CardOperation } from '@/domain/entities/operations'

export type OperationLogEntryConfig = Parameters<OperationLog['push']>[0]

export interface AnimationInstructionSummary {
  waitMs: number
  batchId: string
  metadata?: Record<string, unknown>
  snapshot: {
    player: { hp: number; mana: number }
    hand: Array<{ id?: number; title: string }>
    discardCount: number
    exileCount: number
    deckCount: number
    enemies: Array<{ id: number; hp: number; status: string }>
  }
  damageOutcomes?: Array<{ damage: number; effectType: string }>
}

export interface ActionLogEntrySummary {
  type: BattleActionLogEntry['type']
  card?: number | ValueFactory<number>
  operations?: CardOperation[]
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
  if (entry.animationBatches) {
    summary.animations = entry.animationBatches.flatMap((batch) =>
      (batch.instructions ?? []).map((instruction) => {
        const animationSummary: AnimationInstructionSummary = {
          waitMs: instruction.waitMs,
          batchId: batch.batchId,
          snapshot: {
            player: {
              hp: batch.snapshot.player.currentHp,
              mana: batch.snapshot.player.currentMana,
            },
            hand: batch.snapshot.hand.map((card) => ({
              id: card.id,
              title: card.title,
            })),
            discardCount: batch.snapshot.discardPile.length,
            exileCount: batch.snapshot.exilePile.length,
            deckCount: batch.snapshot.deck.length,
            enemies: batch.snapshot.enemies.map((enemy) => ({
              id: enemy.id,
              hp: enemy.currentHp,
              status: enemy.status,
            })),
          },
        }
        if (instruction.damageOutcomes) {
          animationSummary.damageOutcomes = instruction.damageOutcomes.map((outcome) => ({ ...outcome }))
        }
      if (instruction.metadata) {
        const cleanedMetadata = Object.fromEntries(
          Object.entries(instruction.metadata).filter(([, value]) => value !== undefined),
        )
        if (Object.keys(cleanedMetadata).length > 0) {
          animationSummary.metadata = cleanedMetadata
        }
      }
        return animationSummary
      }),
    )
  }
  return summary
}

export function buildOperationLog(entries: OperationLogEntryConfig[], inclusiveIndex: number): OperationLog {
  const log = new OperationLog()
  entries.slice(0, inclusiveIndex + 1).forEach((entry) => log.push(entry))
  return log
}
