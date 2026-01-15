/**
 * AchievementProgress ストア
 * - ラン中の実績進行度（バトル累計）を保持し、Battle 開始時に Manager を生成する。
 * - Victory 時に Manager の最新進行度を取り込み、次のバトルへ持ち越す。
 * - 各達成条件の累計値を保持し、画面表示と達成判定に供給する。
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
    stickyAccumulated: (state) => state.progress.stickyAccumulated,
    damageTakenCount: (state) => state.progress.damageTakenCount,
    maxDamageTaken: (state) => state.progress.maxDamageTaken,
    maxMultiHitReceived: (state) => state.progress.maxMultiHitReceived,
    kissReceivedCount: (state) => state.progress.kissReceivedCount,
    kissUsedCount: (state) => state.progress.kissUsedCount,
    masochisticAuraUsedCount: (state) => state.progress.masochisticAuraUsedCount,
    defeatCount: (state) => state.progress.defeatCount,
    orcHeroDefeated: (state) => state.progress.orcHeroDefeated,
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
    replaceProgress(progress: AchievementProgress): void {
      // セーブデータからの復元専用。バリデーション済みデータを前提に丸ごと差し替える。
      this.ensureInitialized()
      this.progress = {
        statusCardMemories: progress.statusCardMemories,
        corrosionAccumulated: progress.corrosionAccumulated,
        stickyAccumulated: progress.stickyAccumulated,
        damageTakenCount: progress.damageTakenCount,
        maxDamageTaken: progress.maxDamageTaken,
        maxMultiHitReceived: progress.maxMultiHitReceived,
        kissReceivedCount: progress.kissReceivedCount,
        kissUsedCount: progress.kissUsedCount,
        masochisticAuraUsedCount: progress.masochisticAuraUsedCount,
        defeatCount: progress.defeatCount,
        orcHeroDefeated: progress.orcHeroDefeated,
      }
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
