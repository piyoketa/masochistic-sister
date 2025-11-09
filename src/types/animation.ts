import type { BattleActionLogEntry } from '@/domain/battle/ActionLog'
import type { ResolvedBattleActionLogEntry } from '@/domain/battle/ActionLogReplayer'

export interface StageEventPayload {
  entryType: BattleActionLogEntry['type']
  batchId: string
  metadata?: Record<string, unknown>
  issuedAt: number
  resolvedEntry?: ResolvedBattleActionLogEntry
}
