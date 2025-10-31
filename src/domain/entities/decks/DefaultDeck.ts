import { Card } from '../Card'
import { HeavenChainAction } from '../actions/HeavenChainAction'
import { BattlePrepAction } from '../actions/BattlePrepAction'
import { MasochisticAuraAction } from '../actions/MasochisticAuraAction'
import type { CardRepository } from '../../repository/CardRepository'

export interface DefaultDeckResult {
  deck: Card[]
  heavenChains: readonly [Card, Card, Card, Card, Card]
  battlePreps: readonly [Card, Card]
  masochisticAura: Card
}

export function buildDefaultDeck(cardRepository: CardRepository): DefaultDeckResult {
  const heavenChains = Array.from({ length: 5 }, () =>
    cardRepository.create(() => new Card({ action: new HeavenChainAction() })),
  ) as [Card, Card, Card, Card, Card]

  const battlePreps = Array.from({ length: 2 }, () =>
    cardRepository.create(() => new Card({ action: new BattlePrepAction() })),
  ) as [Card, Card]

  const masochisticAura = cardRepository.create(() => new Card({ action: new MasochisticAuraAction() }))

  const deck: Card[] = [
    heavenChains[0],
    heavenChains[1],
    heavenChains[2],
    battlePreps[0],
    masochisticAura,
    heavenChains[3],
    battlePreps[1],
    heavenChains[4],
  ]

  return {
    deck,
    heavenChains,
    battlePreps,
    masochisticAura,
  }
}
