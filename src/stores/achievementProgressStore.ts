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
    corrosionAccumulated: (state) => state.progress.corrosionAccumulated,
    stickyAccumulated: (state) => state.progress.stickyAccumulated,
    damageTakenCount: (state) => state.progress.damageTakenCount,
    maxDamageTaken: (state) => state.progress.maxDamageTaken,
    maxMultiHitReceived: (state) => state.progress.maxMultiHitReceived,
    maxRelicOwnedCount: (state) => state.progress.maxRelicOwnedCount,
    heavenChainUsedCount: (state) => state.progress.heavenChainUsedCount,
    cowardFleeCount: (state) => state.progress.cowardFleeCount,
    cowardDefeatCount: (state) => state.progress.cowardDefeatCount,
    tentacleDefeatCount: (state) => state.progress.tentacleDefeatCount,
    resultHpAtMost30Count: (state) => state.progress.resultHpAtMost30Count,
    kissReceivedCount: (state) => state.progress.kissReceivedCount,
    kissUsedCount: (state) => state.progress.kissUsedCount,
    masochisticAuraUsedCount: (state) => state.progress.masochisticAuraUsedCount,
    defeatCount: (state) => state.progress.defeatCount,
    orcHeroDefeated: (state) => state.progress.orcHeroDefeated,
    beamCannonDefeated: (state) => state.progress.beamCannonDefeated,
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
        corrosionAccumulated: progress.corrosionAccumulated,
        stickyAccumulated: progress.stickyAccumulated,
        damageTakenCount: progress.damageTakenCount,
        maxDamageTaken: progress.maxDamageTaken,
        maxMultiHitReceived: progress.maxMultiHitReceived,
        maxRelicOwnedCount: progress.maxRelicOwnedCount,
        heavenChainUsedCount: progress.heavenChainUsedCount,
        cowardFleeCount: progress.cowardFleeCount,
        cowardDefeatCount: progress.cowardDefeatCount,
        tentacleDefeatCount: progress.tentacleDefeatCount,
        resultHpAtMost30Count: progress.resultHpAtMost30Count,
        kissReceivedCount: progress.kissReceivedCount,
        kissUsedCount: progress.kissUsedCount,
        masochisticAuraUsedCount: progress.masochisticAuraUsedCount,
        defeatCount: progress.defeatCount,
        orcHeroDefeated: progress.orcHeroDefeated,
        beamCannonDefeated: progress.beamCannonDefeated,
      }
    },
    recordRelicOwnedCount(count: number): void {
      this.ensureInitialized()
      const next = Math.max(0, Math.floor(count))
      if (next <= this.progress.maxRelicOwnedCount) {
        return
      }
      // レリック所持数は最大値を保持し、後から減っても進行度を戻さない。
      this.progress = { ...this.progress, maxRelicOwnedCount: next }
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
