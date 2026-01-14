// フィールド単位のクリア状況だけを管理するストア。
// - セーブデータは単一スロット仕様のため、配列で保持して JSON へ素直に保存できる形にする。
import { defineStore } from 'pinia'
import { normalizeFieldIds } from '@/constants/fieldProgress'

export const useRunProgressStore = defineStore('runProgress', {
  state: () => ({
    initialized: false,
    clearedFieldIds: [] as string[],
  }),
  getters: {
    isFieldCleared: (state) => (fieldId: string): boolean => state.clearedFieldIds.includes(fieldId),
  },
  actions: {
    ensureInitialized(): void {
      if (!this.initialized) {
        this.clearedFieldIds = []
        this.initialized = true
      }
    },
    resetForNewRun(): void {
      // 新規ラン開始時はフィールド進行を完全に初期化する。
      this.clearedFieldIds = []
      this.initialized = true
    },
    setFieldCleared(fieldId: string, cleared: boolean): void {
      this.ensureInitialized()
      const normalized = normalizeFieldIds([fieldId])
      const target = normalized[0]
      if (!target) {
        return
      }
      const current = new Set(this.clearedFieldIds)
      if (cleared) {
        current.add(target)
      } else {
        current.delete(target)
      }
      this.clearedFieldIds = Array.from(current)
    },
    replaceClearedFieldIds(fieldIds: string[]): void {
      // セーブデータ反映時は未知のフィールドIDを除外し、安全な形で差し替える。
      this.clearedFieldIds = normalizeFieldIds(fieldIds)
      this.initialized = true
    },
    exportClearedFieldIds(): string[] {
      return [...this.clearedFieldIds]
    },
  },
})
