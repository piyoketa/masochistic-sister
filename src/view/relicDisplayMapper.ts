import type { RelicDescriptionContext } from '@/domain/entities/relics/Relic'
import type { RelicInfo } from '@/domain/entities/relics/relicLibrary'
import { getRelicInfo } from '@/domain/entities/relics/relicLibrary'
import type { RelicId } from '@/domain/entities/relics/relicTypes'
import type { BattleSnapshotRelic } from '@/domain/battle/Battle'

export type RelicUiState =
  | 'field-disabled'
  | 'passive-inactive'
  | 'passive-active'
  | 'active-ready'
  | 'active-processing'
  | 'disabled'

export type RelicDisplayEntry = RelicInfo & {
  active: boolean
  usesRemaining?: number | null
  manaCost?: number | null
  usable?: boolean
  /** UI専用の状態。指定しない場合は usageType / active / usable から自動判定される。 */
  uiState?: RelicUiState
}

export function mapSnapshotRelics(
  relics: BattleSnapshotRelic[],
  context?: RelicDescriptionContext,
): RelicDisplayEntry[] {
  return relics
    .map((entry) => {
      const info = getRelicInfo(entry.id, context)
      if (!info) return null
      return {
        ...info,
        active: entry.active,
        usesRemaining: entry.usesRemaining,
        manaCost: entry.manaCost,
        usable: entry.usable ?? entry.active,
      }
    })
    .filter((entry): entry is RelicDisplayEntry => entry !== null)
}

export function mapRelicIdsToDisplay(
  relicIds: RelicId[],
  context?: RelicDescriptionContext,
): RelicDisplayEntry[] {
  return relicIds
    .map((relicId) => {
      const info = getRelicInfo(relicId, context)
      if (!info) return null
      return { ...info, active: true, usable: true }
    })
    .filter((entry): entry is RelicDisplayEntry => entry !== null)
}
