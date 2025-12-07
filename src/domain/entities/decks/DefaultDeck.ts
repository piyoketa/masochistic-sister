import { Card } from '../Card'
import { HeavenChainAction } from '../actions/HeavenChainAction'
import { BattlePrepAction } from '../actions/BattlePrepAction'
import { MasochisticAuraAction } from '../actions/MasochisticAuraAction'
import { DeepBreathAction } from '../actions/DeepBreathAction'
import { FlashbackAction } from '../actions/FlashbackAction'
import type { CardRepository } from '../../repository/CardRepository'

export interface DefaultDeckResult {
  deck: Card[]
  heavenChains: readonly [Card, Card, Card, Card, Card]
  battlePreps: readonly [Card]
  masochisticAuras: readonly [Card, Card]
  deepBreaths: readonly [Card]
  flashbacks: readonly [Card]
}

export function buildDefaultDeck(cardRepository: CardRepository): DefaultDeckResult {
  const heavenChains = Array.from({ length: 5 }, () =>
    cardRepository.create(() => new Card({ action: new HeavenChainAction() })),
  ) as [Card, Card, Card, Card, Card]

  const battlePreps = Array.from({ length: 1 }, () =>
    cardRepository.create(() => new Card({ action: new BattlePrepAction() })),
  ) as [Card]

  const masochisticAuras = Array.from({ length: 2 }, () =>
    cardRepository.create(() => new Card({ action: new MasochisticAuraAction() })),
  ) as [Card, Card]

  const deepBreaths = [cardRepository.create(() => new Card({ action: new DeepBreathAction() }))] as [Card]
  const flashbacks = [cardRepository.create(() => new Card({ action: new FlashbackAction() }))] as [Card]

  const pool: Card[] = [...heavenChains, ...battlePreps, ...masochisticAuras, ...deepBreaths, ...flashbacks]
  const deck = shuffle([...pool])

  return {
    deck,
    heavenChains,
    battlePreps,
    masochisticAuras,
    deepBreaths,
    flashbacks,
  }
}

function shuffle(cards: Card[]): Card[] {
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cards[i], cards[j]] = [cards[j]!, cards[i]!]
  }
  return cards
}
