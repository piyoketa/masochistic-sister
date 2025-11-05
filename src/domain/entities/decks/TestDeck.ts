import { Card } from '../Card'
import { HeavenChainAction } from '../actions/HeavenChainAction'
import { BattlePrepAction } from '../actions/BattlePrepAction'
import { MasochisticAuraAction } from '../actions/MasochisticAuraAction'
import { DailyRoutineAction } from '../actions/DailyRoutineAction'
import { ScarRegenerationAction } from '../actions/ScarRegenerationAction'
import type { CardRepository } from '../../repository/CardRepository'

export interface TestDeckResult {
  deck: Card[]
  heavenChains: readonly [Card, Card, Card, Card]
  masochisticAuras: readonly [Card, Card]
  battlePrep: Card
  dailyRoutine: Card
  ache: Card
}

export function buildTestDeck(cardRepository: CardRepository): TestDeckResult {
  const heavenChains = Array.from({ length: 4 }, () =>
    cardRepository.create(() => new Card({ action: new HeavenChainAction() })),
  ) as [Card, Card, Card, Card]

  const masochisticAuras = Array.from({ length: 2 }, () =>
    cardRepository.create(() => new Card({ action: new MasochisticAuraAction() })),
  ) as [Card, Card]

  const battlePrep = cardRepository.create(() => new Card({ action: new BattlePrepAction() }))
  const dailyRoutine = cardRepository.create(() => new Card({ action: new DailyRoutineAction() }))
  const ache = cardRepository.create(() => new Card({ action: new ScarRegenerationAction() }))

  const deck: Card[] = [
    heavenChains[0],
    heavenChains[1],
    battlePrep,
    masochisticAuras[0],
    dailyRoutine,
    heavenChains[2],
    ache,
    masochisticAuras[1],
    heavenChains[3],
  ]

  return {
    deck,
    heavenChains,
    masochisticAuras,
    battlePrep,
    dailyRoutine,
    ache,
  }
}
