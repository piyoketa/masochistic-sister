import { defineStore } from 'pinia'
import { CardRepository } from '@/domain/repository/CardRepository'
import { buildDefaultDeck } from '@/domain/entities/decks'
import { listRelicClassNames } from '@/domain/entities/relics/relicLibrary'
import { createCardFromBlueprint, mapActionToDeckCardType, type DeckCardBlueprint, type DeckCardType } from '@/domain/library/Library'
import { Card } from '@/domain/entities/Card'
import type { Action } from '@/domain/entities/Action'

// store外からデッキ型を参照できるように明示的に再エクスポートする
export type { DeckCardType, DeckCardBlueprint } from '@/domain/library/Library'

interface DeckPreviewEntry {
  id: number
  title: string
  description: string
  type: DeckCardType
}

const DEFAULT_RELICS: string[] = []

export const usePlayerStore = defineStore('player', {
  state: () => ({
    hp: 150,
    maxHp: 150,
    gold: 0,
    deck: [] as DeckCardBlueprint[],
    relics: [] as string[],
    initialized: false,
  }),
  actions: {
    ensureInitialized(): void {
      if (!this.initialized) {
        this.resetDeckToDefault()
      }
    },
    resetDeckToDefault(): void {
      const repository = new CardRepository()
      const { deck } = buildDefaultDeck(repository)
      this.deck = deck.map((card) => cardToBlueprint(card))
      this.gold = 0
      this.relics = [...DEFAULT_RELICS]
      this.initialized = true
    },
    setDeck(blueprints: DeckCardBlueprint[]): void {
      this.deck = [...blueprints]
      this.initialized = true
    },
    buildDeck(cardRepository: CardRepository): Card[] {
      this.ensureInitialized()
      const cards = this.deck.map((blueprint) => createCardFromBlueprint(blueprint, cardRepository))
      // 状態異常カードは山札の先頭に集め、各グループ内でシャッフルする
      const statusCards = cards.filter((card) => card.type === 'status')
      const otherCards = cards.filter((card) => card.type !== 'status')
      const ordered = [...shuffle(statusCards), ...shuffle(otherCards)]
      return ordered
    },
    getDeckPreview(): DeckPreviewEntry[] {
      this.ensureInitialized()
      return this.deck.map((blueprint, index) => {
        const card = createCardFromBlueprint(blueprint, new CardRepository())
        return {
          id: index,
          title: card.title,
          description: card.description,
          type: blueprint.type,
        }
      })
    },
    addCard(type: DeckCardType, overrides?: { amount?: number; count?: number }): void {
      this.ensureInitialized()
      const next: DeckCardBlueprint = { type }
      if (typeof overrides?.amount === 'number') {
        next.overrideAmount = overrides.amount
      }
      if (typeof overrides?.count === 'number') {
        next.overrideCount = overrides.count
      }
      this.deck = [...this.deck, next]
      this.initialized = true
    },
    removeCardAt(index: number): void {
      this.ensureInitialized()
      if (index < 0 || index >= this.deck.length) {
        return
      }
      this.deck = this.deck.filter((_, i) => i !== index)
    },
    duplicateCardAt(index: number): void {
      this.ensureInitialized()
      const target = this.deck[index]
      if (!target) {
        return
      }
      const cloned = { ...target }
      const next = [...this.deck]
      next.splice(index + 1, 0, cloned)
      this.deck = next
    },
    updateAttackOverride(index: number, overrides: { amount?: number; count?: number }): void {
      this.ensureInitialized()
      const target = this.deck[index]
      if (!target) {
        return
      }
      const next = [...this.deck]
      next[index] = {
        ...target,
        overrideAmount: overrides.amount ?? target.overrideAmount,
        overrideCount: overrides.count ?? target.overrideCount,
      }
      this.deck = next
    },
    addGold(amount: number): void {
      const gain = Math.max(0, Math.floor(amount))
      if (gain <= 0) {
        return
      }
      this.gold += gain
    },
    spendGold(amount: number): void {
      const cost = Math.max(0, Math.floor(amount))
      if (cost <= 0) {
        return
      }
      this.gold = Math.max(0, this.gold - cost)
    },
    setGold(amount: number): void {
      this.gold = Math.max(0, Math.floor(amount))
    },
    setHp(amount: number): void {
      this.ensureInitialized()
      const next = Math.floor(amount)
      const clamped = Math.min(this.maxHp, Math.max(0, next))
      this.hp = clamped
    },
    setMaxHp(amount: number): void {
      this.ensureInitialized()
      const next = Math.max(1, Math.floor(amount))
      this.maxHp = next
      // 最大HPを下げた場合でも、現在HPが超過しないように丸める
      if (this.hp > next) {
        this.hp = next
      }
    },
    healHp(amount: number): void {
      const heal = Math.max(0, Math.floor(amount))
      if (heal <= 0) {
        return
      }
      this.hp = Math.min(this.maxHp, this.hp + heal)
    },
    setRelics(classNames: string[]): void {
      this.relics = [...classNames]
      this.initialized = true
    },
    addRelic(className: string): void {
      const known = listRelicClassNames()
      if (known.length > 0 && !known.includes(className)) {
        return
      }
      if (this.relics.includes(className)) {
        return
      }
      this.relics = [...this.relics, className]
    },
    removeRelic(className: string): void {
      this.relics = this.relics.filter((name) => name !== className)
    },
  },
})

function cardToBlueprint(card: Card): DeckCardBlueprint {
  const action = card.action
  if (!action) {
    throw new Error('デッキのカードにアクションが設定されていません')
  }
  const key = mapActionToDeckCardType(action)
  if (!key) {
    throw new Error(`未対応のカードアクション "${action.constructor.name}" です`)
  }
  return { type: key }
}

function shuffle<T>(items: T[]): T[] {
  const copied = [...items]
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copied[i], copied[j]] = [copied[j]!, copied[i]!]
  }
  return copied
}
