import type { BattleActionLogEntry, AnimationStageMetadata } from '@/domain/battle/ActionLog'
import type { ResolvedBattleActionLogEntry } from '@/domain/battle/ActionLogReplayer'

export type StageEventMetadata = AnimationStageMetadata

export interface StageEventPayload {
  entryType: BattleActionLogEntry['type']
  batchId: string
  metadata?: StageEventMetadata
  issuedAt: number
  resolvedEntry?: ResolvedBattleActionLogEntry
}
