import { Card } from '../Card'
import { HeavenChainAction } from '../actions/HeavenChainAction'
import { BattlePrepAction } from '../actions/BattlePrepAction'
import { MasochisticAuraAction } from '../actions/MasochisticAuraAction'
import type { CardRepository } from '../../repository/CardRepository'

export interface DefaultDeckResult {
  deck: Card[]
  heavenChains: Card[]
  battlePreps: Card[]
  masochisticAura: Card
}

export function buildDefaultDeck(cardRepository: CardRepository): DefaultDeckResult {
  const heavenChains = Array.from({ length: 5 }).map(() =>
    cardRepository.create(() => new Card({ action: new HeavenChainAction() })),
  )

  const battlePreps = Array.from({ length: 2 }).map(() =>
    cardRepository.create(() => new Card({ action: new BattlePrepAction() })),
  )

  const masochisticAura = cardRepository.create(
    () => new Card({ action: new MasochisticAuraAction() }),
  )

  const deck = [
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
