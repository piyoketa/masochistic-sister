import type { BattleActionLogEntry } from '@/domain/battle/ActionLog'

export interface StageEventPayload {
  entryType: BattleActionLogEntry['type']
  batchId: string
  metadata?: Record<string, unknown>
  issuedAt: number
}
