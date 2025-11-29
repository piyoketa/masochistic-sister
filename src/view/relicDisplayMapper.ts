import type { RelicInfo } from '@/domain/entities/relics/relicLibrary'
import { getRelicInfo } from '@/domain/entities/relics/relicLibrary'

export type RelicDisplayEntry = RelicInfo & { active: boolean }

export function mapSnapshotRelics(
  relics: Array<{ className: string; active: boolean }>,
): RelicDisplayEntry[] {
  return relics
    .map((entry) => {
      const info = getRelicInfo(entry.className)
      if (!info) return null
      return { ...info, active: entry.active }
    })
    .filter((entry): entry is RelicDisplayEntry => entry !== null)
}

export function mapClassNamesToDisplay(classNames: string[]): RelicDisplayEntry[] {
  return classNames
    .map((className) => {
      const info = getRelicInfo(className)
      if (!info) return null
      return { ...info, active: true }
    })
    .filter((entry): entry is RelicDisplayEntry => entry !== null)
}
