import { defineStore } from 'pinia'
import type { CardInfo } from '@/types/battle'
import type { DeckCardType } from './playerStore'

/**
 * rewardStore の責務:
 * - Battle 勝利時に算出した報酬情報を一時的に保持し、RewardView へ受け渡す。
 * - 受け取りが完了したら state をクリアし、再入場時に誤表示しないようにする。
 *
 * 非責務:
 * - 報酬の計算ロジック（BattleReward に委譲）。
 * - 実際の HP 回復やカード追加（RewardView 側で playerStore を更新）。
 */
export interface RewardCardEntry {
  id: string
  info: CardInfo
  deckType: DeckCardType | null
}

export interface PendingReward {
  battleId: string
  hpHeal: number
  gold: number
  defeatedCount: number
  cards: RewardCardEntry[]
}

export const useRewardStore = defineStore('reward', {
  state: () => ({
    pending: null as PendingReward | null,
  }),
  actions: {
    setReward(reward: PendingReward): void {
      // 呼び出し側で計算済みの報酬を保存するだけ。UI 表示は RewardView に委譲する。
      this.pending = { ...reward, cards: [...reward.cards] }
    },
    clear(): void {
      this.pending = null
    },
  },
})
