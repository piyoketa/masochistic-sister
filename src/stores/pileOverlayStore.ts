import { defineStore } from 'pinia'
import type { CardInfo } from '@/types/battle'

type ActivePile = 'deck' | 'discard' | null

interface PileOverlayState {
  activePile: ActivePile
  deckCards: CardInfo[]
  discardCards: CardInfo[]
}

export const usePileOverlayStore = defineStore('pileOverlay', {
  state: (): PileOverlayState => ({
    activePile: null,
    deckCards: [],
    discardCards: [],
  }),
  actions: {
    openDeck(deckCards: CardInfo[], discardCards: CardInfo[] = []): void {
      this.deckCards = [...deckCards]
      this.discardCards = [...discardCards]
      this.activePile = 'deck'
    },
    openDiscard(deckCards: CardInfo[], discardCards: CardInfo[]): void {
      this.deckCards = [...deckCards]
      this.discardCards = [...discardCards]
      this.activePile = 'discard'
    },
    close(): void {
      this.activePile = null
    },
  },
})
