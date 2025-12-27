import { describe, it, expect } from 'vitest'

import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { OperationLogReplayer } from '@/domain/battle/OperationLogReplayer'
import { CardRepository } from '@/domain/repository/CardRepository'
import { MasochisticAuraAction } from '@/domain/entities/actions/MasochisticAuraAction'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { HeavenChainAction } from '@/domain/entities/actions/HeavenChainAction'
import { Card } from '@/domain/entities/Card'
import { TestOrcWrestlerTeam } from '@/domain/entities/enemyTeams'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { buildOperationLog, type OperationLogEntryConfig } from './utils/battleLogTestUtils'
import { requireCardId } from './utils/scenarioEntityUtils'

function buildFixedDeckAndHand(cardRepository: CardRepository): { deck: Card[]; hand: Card[] } {
  const create = <T extends Card>(factory: () => T) => cardRepository.create(factory)
  const deck: Card[] = [
    create(() => new Card({ action: new MasochisticAuraAction() })),
    create(() => new Card({ action: new BattlePrepAction() })),
    create(() => new Card({ action: new HeavenChainAction() })),
    create(() => new Card({ action: new HeavenChainAction() })),
    create(() => new Card({ action: new HeavenChainAction() })),
    create(() => new Card({ action: new HeavenChainAction() })),
  ]
  const hand: Card[] = [
    create(() => new Card({ action: new MasochisticAuraAction() })),
    create(() => new Card({ action: new BattlePrepAction() })),
    create(() => new Card({ action: new HeavenChainAction() })),
    create(() => new Card({ action: new HeavenChainAction() })),
  ]
  return { deck, hand }
}

const battleFactory = () => {
  const cardRepository = new CardRepository()
  const { deck, hand } = buildFixedDeckAndHand(cardRepository)
  return new Battle({
    id: 'battle-scenario-3',
    cardRepository,
    player: new ProtagonistPlayer(),
    enemyTeam: new TestOrcWrestlerTeam(),
    deck: new Deck(deck),
    hand: new Hand(hand),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

const operationEntries: OperationLogEntryConfig[] = [
  {
    type: 'play-card',
    card: (battle) =>
      requireCardId(battle.hand.list().find((card) => card.title === '戦いの準備')),
  },
]

describe('シナリオ3: 戦いの準備のプレイ時演出', () => {
  it('mana と card-trash の両方が含まれ、戦いの準備のカードが手札から消える', () => {
    const operationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog } = replayer.buildActionLog()
    const playEntry = actionLog.toArray().find((entry) => entry.type === 'play-card')
    expect(playEntry).toBeTruthy()
    if (!playEntry || typeof playEntry.card !== 'number') {
      return
    }
    const battlePrepId = playEntry.card
    const instructions =
      (playEntry.animationBatches ?? []).flatMap((batch) => batch.instructions ?? [])
    const stages = instructions
      .map((instruction) => (instruction.metadata as { stage?: string } | undefined)?.stage)
      .filter((stage): stage is string => typeof stage === 'string')
    expect(stages).toContain('mana')
    const cardTrash = instructions.find(
      (instruction) => (instruction.metadata as { stage?: string } | undefined)?.stage === 'card-trash',
    )
    expect(cardTrash).toBeTruthy()
    if (cardTrash) {
      expect(cardTrash.waitMs).toBe(600)
      const metadata = cardTrash.metadata as { cardIds?: number[]; cardTitles?: string[] }
      expect(metadata.cardIds ?? []).toContain(battlePrepId)
      expect(metadata.cardTitles ?? []).toContain('戦いの準備')
    }
    const handIdsAfter = (playEntry.postEntrySnapshot?.hand ?? [])
      .map((card) => card.id)
      .filter((id): id is number => typeof id === 'number')
    expect(handIdsAfter).not.toContain(battlePrepId)
  })
})
