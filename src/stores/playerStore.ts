import { defineStore } from 'pinia'
import { Card } from '@/domain/entities/Card'
import { CardRepository } from '@/domain/repository/CardRepository'
import { buildDefaultDeck } from '@/domain/entities/decks'
import { HeavenChainAction } from '@/domain/entities/actions/HeavenChainAction'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { MasochisticAuraAction } from '@/domain/entities/actions/MasochisticAuraAction'

type DeckCardType = 'heaven-chain' | 'battle-prep' | 'masochistic-aura'

export interface DeckCardBlueprint {
  type: DeckCardType
}

interface DeckPreviewEntry {
  id: number
  title: string
  description: string
  type: DeckCardType
}

const cardFactories: Record<DeckCardType, () => Card> = {
  'heaven-chain': () => new Card({ action: new HeavenChainAction() }),
  'battle-prep': () => new Card({ action: new BattlePrepAction() }),
  'masochistic-aura': () => new Card({ action: new MasochisticAuraAction() }),
}

const actionConstructorMap = new Map<Function, DeckCardType>([
  [HeavenChainAction, 'heaven-chain'],
  [BattlePrepAction, 'battle-prep'],
  [MasochisticAuraAction, 'masochistic-aura'],
])

export const usePlayerStore = defineStore('player', {
  state: () => ({
    hp: 150,
    maxHp: 150,
    deck: [] as DeckCardBlueprint[],
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
      this.initialized = true
    },
    setDeck(blueprints: DeckCardBlueprint[]): void {
      this.deck = [...blueprints]
      this.initialized = true
    },
    buildDeck(cardRepository: CardRepository): Card[] {
      this.ensureInitialized()
      const cards = this.deck.map((blueprint) => createCardFromBlueprint(cardRepository, blueprint))
      return shuffle(cards)
    },
    getDeckPreview(): DeckPreviewEntry[] {
      this.ensureInitialized()
      return this.deck.map((blueprint, index) => {
        const card = createStandaloneCard(blueprint)
        return {
          id: index,
          title: card.title,
          description: card.description,
          type: blueprint.type,
        }
      })
    },
  },
})

function cardToBlueprint(card: Card): DeckCardBlueprint {
  const action = card.action
  if (!action) {
    throw new Error('デッキのカードにアクションが設定されていません')
  }
  const key = actionConstructorMap.get(action.constructor as Function)
  if (!key) {
    throw new Error(`未対応のカードアクション "${action.constructor.name}" です`)
  }
  return { type: key }
}

function createCardFromBlueprint(
  repository: CardRepository,
  blueprint: DeckCardBlueprint,
): Card {
  const factory = cardFactories[blueprint.type]
  if (!factory) {
    throw new Error(`未対応のカード種別 "${blueprint.type}" です`)
  }
  return repository.create(() => factory())
}

function createStandaloneCard(blueprint: DeckCardBlueprint): Card {
  const factory = cardFactories[blueprint.type]
  if (!factory) {
    throw new Error(`未対応のカード種別 "${blueprint.type}" です`)
  }
  return factory()
}

function shuffle<T>(items: T[]): T[] {
  const copied = [...items]
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copied[i], copied[j]] = [copied[j]!, copied[i]!]
  }
  return copied
}
