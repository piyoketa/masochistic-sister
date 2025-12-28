import type { RelicInfo } from '@/domain/entities/relics/relicLibrary'
import { getRelicInfo } from '@/domain/entities/relics/relicLibrary'
import type { BattleSnapshotRelic } from '@/domain/battle/Battle'

export type RelicDisplayEntry = RelicInfo & {
  active: boolean
  usesRemaining?: number | null
  manaCost?: number | null
  usable?: boolean
}

export function mapSnapshotRelics(
  relics: BattleSnapshotRelic[],
): RelicDisplayEntry[] {
  return relics
    .map((entry) => {
      const info = getRelicInfo(entry.className)
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

export function mapClassNamesToDisplay(classNames: string[]): RelicDisplayEntry[] {
  return classNames
    .map((className) => {
      const info = getRelicInfo(className)
      if (!info) return null
      return { ...info, active: true, usable: true }
    })
    .filter((entry): entry is RelicDisplayEntry => entry !== null)
}
