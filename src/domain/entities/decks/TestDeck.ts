import { Card } from '../Card'
import { HeavenChainAction } from '../actions/HeavenChainAction'
import { BattlePrepAction } from '../actions/BattlePrepAction'
import { MasochisticAuraAction } from '../actions/MasochisticAuraAction'
import { DailyRoutineAction } from '../actions/DailyRoutineAction'
import { ScarRegenerationAction } from '../actions/ScarRegenerationAction'
import { ReloadAction } from '../actions/ReloadAction'
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
  const extraHeavenChains = Array.from({ length: 2 }, () =>
    cardRepository.create(() => new Card({ action: new HeavenChainAction() })),
  ) as [Card, Card]

  // experimental 手札ルール（初期ドロー0枚・ターン開始4枚）でも初手/ターン3で必要カードが途切れないよう、並びと余剰カードを固定する
  const deck: Card[] = [
    masochisticAuras[0],
    dailyRoutine,
    battlePrep,
    heavenChains[0],
    heavenChains[1],
    masochisticAuras[1],
    heavenChains[2],
    extraHeavenChains[0],
    heavenChains[3],
    extraHeavenChains[1],
    ache,
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

export interface Scenario2DeckResult {
  deck: Card[]
  heavenChains: readonly [Card, Card, Card, Card]
  masochisticAuras: readonly [Card, Card]
  battlePrep: Card
  dailyRoutine: Card
  reload: Card
}

export function buildScenario2Deck(cardRepository: CardRepository): Scenario2DeckResult {
  const heavenChains = Array.from({ length: 4 }, () =>
    cardRepository.create(() => new Card({ action: new HeavenChainAction() })),
  ) as [Card, Card, Card, Card]

  const masochisticAuras = Array.from({ length: 2 }, () =>
    cardRepository.create(() => new Card({ action: new MasochisticAuraAction() })),
  ) as [Card, Card]

  const battlePrep = cardRepository.create(() => new Card({ action: new BattlePrepAction() }))
  const dailyRoutine = cardRepository.create(() => new Card({ action: new DailyRoutineAction() }))
  const reload = cardRepository.create(() => new Card({ action: new ReloadAction() }))

  const deck: Card[] = [
    heavenChains[0],
    heavenChains[1],
    battlePrep,
    masochisticAuras[0],
    dailyRoutine,
    heavenChains[2],
    masochisticAuras[1],
    reload,
    heavenChains[3],
  ]

  return {
    deck,
    heavenChains,
    masochisticAuras,
    battlePrep,
    dailyRoutine,
    reload,
  }
}

export function buildDefaultDeck2(cardRepository: CardRepository): Scenario2DeckResult {
  const base = buildScenario2Deck(cardRepository)
  return {
    ...base,
    deck: shuffleCards([...base.deck]),
  }
}

export interface TutorialDeckResult {
  deck: Card[]
  heavenChain: Card
  masochisticAura: Card
  battlePreps: readonly [Card, Card]
  dailyRoutine: Card
}

/**
 * チュートリアル用の固定デッキ。
 * 初手5枚（山札上からの順番）: 被虐のオーラ / 天の鎖 / 戦いの準備 / 戦いの準備 / 日課
 * 学習用にドロー順を固定し、最低限の5枚構成に絞ることでチュートリアルの体験を安定させる。
 */
export function buildTutorialDeck(cardRepository: CardRepository): TutorialDeckResult {
  // チュートリアルでは攻撃/防御/サポートの流れを明示するため、必要枚数のみ生成する。
  const heavenChain = cardRepository.create(() => new Card({ action: new HeavenChainAction() }))
  const masochisticAura = cardRepository.create(() => new Card({ action: new MasochisticAuraAction() }))
  const battlePreps = Array.from({ length: 2 }, () =>
    cardRepository.create(() => new Card({ action: new BattlePrepAction() })),
  ) as [Card, Card]
  const dailyRoutine = cardRepository.create(() => new Card({ action: new DailyRoutineAction() }))

  const deck: Card[] = [
    masochisticAura,
    heavenChain,
    battlePreps[0],
    battlePreps[1],
    dailyRoutine,
  ]

  return {
    deck,
    heavenChain,
    masochisticAura,
    battlePreps,
    dailyRoutine,
  }
}

function shuffleCards(cards: Card[]): Card[] {
  // Fisher-Yates shuffle: デッキ順序を均等にランダム化し、テストケース用に多様な初期配置を生成する。
  for (let index = cards.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[cards[index], cards[swapIndex]] = [cards[swapIndex]!, cards[index]!]
  }
  return cards
}
