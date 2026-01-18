import { defineStore } from 'pinia'
import type { CardInfo } from '@/types/battle'

interface PlayerDeckOverlayState {
  visible: boolean
  cards: CardInfo[]
}

export const usePlayerDeckOverlayStore = defineStore('playerDeckOverlay', {
  state: (): PlayerDeckOverlayState => ({
    visible: false,
    cards: [],
  }),
  actions: {
    open(cards: CardInfo[]): void {
      // 表示中に元配列が変化しても一覧が崩れないようコピーを保持する。
      this.cards = [...cards]
      this.visible = true
    },
    close(): void {
      this.visible = false
      this.cards = []
    },
  },
})
