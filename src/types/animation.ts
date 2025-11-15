import type { BattleActionLogEntry, AnimationStageMetadata } from '@/domain/battle/ActionLog'
import type { ResolvedBattleActionLogEntry } from '@/domain/battle/ActionLogReplayer'
import type { DamageOutcome } from '@/domain/entities/Damages'

export type StageEventMetadata = AnimationStageMetadata & {
  damageOutcomes?: readonly DamageOutcome[]
}

export interface StageEventPayload {
  entryType: BattleActionLogEntry['type']
  batchId: string
  metadata?: StageEventMetadata
  issuedAt: number
  resolvedEntry?: ResolvedBattleActionLogEntry
}
