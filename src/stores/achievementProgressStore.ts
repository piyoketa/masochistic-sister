/**
 * AchievementProgress ストア
 * - ラン中の実績進行度（バトル累計）を保持し、Battle 開始時に Manager を生成する。
 * - Victory 時に Manager の最新進行度を取り込み、次のバトルへ持ち越す。
 * - 現段階では「状態異常カード累計8枚獲得」のみを扱い、他条件は後続対応。
 */
import { defineStore } from 'pinia'
import {
  createDefaultAchievementProgress,
  type AchievementProgress,
} from '@/domain/achievements/types'
import { AchievementProgressManager } from '@/domain/achievements/AchievementProgressManager'

export const useAchievementProgressStore = defineStore('achievementProgress', {
  state: () => ({
    initialized: false,
    progress: createDefaultAchievementProgress(),
  }),
  getters: {
    statusCardMemories: (state) => state.progress.statusCardMemories,
    corrosionAccumulated: (state) => state.progress.corrosionAccumulated,
    statusCardUsed: (state) => state.progress.statusCardUsed,
    memoryCardUsed: (state) => state.progress.memoryCardUsed,
    multiAttackAcquired: (state) => state.progress.multiAttackAcquired,
  },
  actions: {
    ensureInitialized(): void {
      if (this.initialized) return
      this.progress = createDefaultAchievementProgress()
      this.initialized = true
    },
    resetForNewRun(): void {
      this.ensureInitialized()
      this.progress = createDefaultAchievementProgress()
    },
    /** 現在の進行度から Manager を生成し、Battle へ注入する */
    buildManager(): AchievementProgressManager {
      this.ensureInitialized()
      return new AchievementProgressManager({ ...this.progress })
    },
    /** Battle 終了後に Manager の進行度を取り込み、次戦へ持ち越す */
    updateFromManager(manager: AchievementProgressManager | null | undefined): void {
      if (!manager) return
      this.ensureInitialized()
      this.progress = manager.exportProgress()
    },
  },
})
