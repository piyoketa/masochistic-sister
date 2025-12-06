/*
ShopManager.ts の責務:
- カード売却／ショップ商品（HP回復・カード・レリック）の価格決定と品揃えの選定を一元管理する。
- フィールド初期化時に `setupOffers` を呼び出し、ショップに並べるカード・レリックの候補を決める。

非責務:
- 実際の売買処理（カード削除やゴールド加算、レリック付与）は呼び出し側で行う。
- 報酬計算やカード生成のロジック。

主な通信相手:
- DeckView など、カード売買を行うビュー。`calculateSellPrice` / `getOffers` を用いて価格と品揃えを取得する。
*/
import type { CardInfo } from '@/types/battle'
import type { DeckCardType } from '@/domain/library/Library'

export const CARD_CANDIDATES: DeckCardType[] = [
  'battle-prep',
  'daily-routine',
  'predicament',
  'non-violence-prayer',
  'reload',
  'scar-regeneration',
  'life-drain-skill',
]

export const RELIC_CANDIDATES = [
  'LightweightCombatRelic',
  'PureBodyRelic',
  'NoViolenceRelic',
  'ArcaneAdaptationRelic',
  'ThoroughPreparationRelic',
]

export type CardOffer = {
  deckType: DeckCardType
  price: number
  sale: boolean
}

export type RelicOffer = {
  relicClassName: string
  price: number
  sale: boolean
}

type ShopState = {
  cards: CardOffer[]
  relics: RelicOffer[]
  heal: { amount: number; basePrice: number; purchased: number; price: number }
}

const HEAL_AMOUNT = 50
const HEAL_PRICE = 3
const CARD_PRICE = 3
const CARD_PRICE_SALE = 1
const RELIC_PRICE = 5
const RELIC_PRICE_SALE = 2

export class ShopManager {
  private state: ShopState = {
    cards: [],
    relics: [],
    heal: { amount: HEAL_AMOUNT, basePrice: HEAL_PRICE, purchased: 0, price: HEAL_PRICE },
  }

  /**
   * フィールド初期化時に品揃えを決定する。
   * - カード: 候補からランダムに4枚、うち1枚をセール品にする。
   * - レリック: 未所持からランダムに3つ、うち1つをセール品にする。
   */
  setupOffers(params: { ownedRelics: string[] }): void {
    const { ownedRelics } = params
    const cardTypes = pickUnique(CARD_CANDIDATES, 4)
    const cardOffers: CardOffer[] = cardTypes.map((deckType) => ({
      deckType,
      price: CARD_PRICE,
      sale: false,
    }))
    markRandomSale(cardOffers, CARD_PRICE_SALE)

    const relicCandidates = RELIC_CANDIDATES.filter((className) => !ownedRelics.includes(className))
    const relicTypes = pickUnique(relicCandidates, 3)
    const relicOffers: RelicOffer[] = relicTypes.map((relicClassName) => ({
      relicClassName,
      price: RELIC_PRICE,
      sale: false,
    }))
    markRandomSale(relicOffers, RELIC_PRICE_SALE)

    this.state = {
      cards: cardOffers,
      relics: relicOffers,
      heal: { amount: HEAL_AMOUNT, basePrice: HEAL_PRICE, purchased: 0, price: HEAL_PRICE },
    }
  }

  /**
   * 既に品揃えが決まっていない場合のみ setupOffers を実行する。
   */
  ensureOffers(ownedRelics: string[]): void {
    if (this.state.cards.length === 0 && this.state.relics.length === 0) {
      this.setupOffers({ ownedRelics })
    }
  }

  markCardSold(deckType: DeckCardType): void {
    this.state.cards = this.state.cards.filter((offer) => offer.deckType !== deckType)
  }

  markRelicSold(className: string): void {
    this.state.relics = this.state.relics.filter((offer) => offer.relicClassName !== className)
  }

  markHealPurchased(): void {
    this.state.heal = {
      ...this.state.heal,
      purchased: this.state.heal.purchased + 1,
      price: this.state.heal.basePrice * (this.state.heal.purchased + 2),
    }
  }

  getOffers(): ShopState {
    return {
      cards: [...this.state.cards],
      relics: [...this.state.relics],
      heal: { ...this.state.heal },
    }
  }

  /**
   * カード情報から売値を算出する。
   * 仕様:
   * - アタック: 3G
   * - 状態異常: 2G
   * - それ以外（スキル・スキップなど）は 0G
   */
  calculateSellPrice(card: CardInfo | null | undefined): number {
    if (!card) {
      return 0
    }
    if (card.type === 'attack') {
      return 3
    }
    if (card.type === 'status') {
      return 2
    }
    return 0
  }
}

function pickUnique<T>(arr: T[], count: number): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]
    const swap = copy[j]
    if (tmp === undefined || swap === undefined) {
      continue
    }
    copy[i] = swap
    copy[j] = tmp
  }
  return copy.slice(0, Math.min(count, copy.length))
}

function markRandomSale<T extends { price: number; sale: boolean }>(items: T[], salePrice: number): void {
  if (items.length === 0) {
    return
  }
  const idx = Math.floor(Math.random() * items.length)
  if (idx < 0 || idx >= items.length) {
    return
  }
  const target = items[idx]
  if (!target) {
    return
  }
  target.sale = true
  target.price = salePrice
}

export const shopManager = new ShopManager()
