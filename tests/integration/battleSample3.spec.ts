import { describe, it, expect } from 'vitest'

import fs from 'node:fs'
import path from 'node:path'
import { inspect } from 'node:util'

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
import { describeAsyncBattle } from './utils/asyncBattleTestUtils'

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
    relicIds: ['sacrificial-awareness'],
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
      expect(cardTrash.waitMs).toBe(400)
      const metadata = cardTrash.metadata as { cardIds?: number[]; cardTitles?: string[] }
      expect(metadata.cardIds ?? []).toContain(battlePrepId)
      expect(metadata.cardTitles ?? []).toContain('戦いの準備')
    }
    const handIdsAfter = (playEntry.postEntrySnapshot?.hand ?? [])
      .map((card) => card.id)
      .filter((id): id is number => typeof id === 'number')
    expect(handIdsAfter).not.toContain(battlePrepId)
  })

  it('ターン即終了時のend-player-turnにcard-trash演出が含まれ手札が空になる', () => {
    const operationLog = buildOperationLog([{ type: 'end-player-turn' }], 0)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog, initialSnapshot } = replayer.buildActionLog()
    const endEntry = actionLog.toArray().find((entry) => entry.type === 'end-player-turn')
    expect(endEntry).toBeTruthy()
    if (!endEntry) {
      return
    }
    // endEntry を最下層まで展開し、再現性を高めるためソート付きでデバッグ出力する
    const outputDir = path.resolve(process.cwd(), 'tests', 'integration', '__outputs__')
    fs.mkdirSync(outputDir, { recursive: true })
    const endEntryDumpPath = path.join(outputDir, 'battleSample3-endEntry.log')
    const expandedEndEntry = inspect(endEntry, {
      depth: null,
      maxArrayLength: null,
      sorted: true,
      compact: false,
    })
    fs.writeFileSync(endEntryDumpPath, expandedEndEntry, 'utf-8')

    const startTurnEntry = actionLog.toArray().find((entry) => entry.type === 'start-player-turn')
    expect(startTurnEntry).toBeTruthy()
    if (!startTurnEntry) {
      return
    }

    const handIdsBeforeEnd = (startTurnEntry.postEntrySnapshot?.hand ?? [])
      .map((card) => card.id)
      .filter((id): id is number => typeof id === 'number')

    const instructions =
      (endEntry.animationBatches ?? []).flatMap((batch) => batch.instructions ?? [])
    const cardTrash = instructions.find(
      (instruction) => (instruction.metadata as { stage?: string } | undefined)?.stage === 'card-trash',
    )
    expect(cardTrash).toBeTruthy()
    if (!cardTrash) {
      return
    }
    expect(cardTrash.waitMs).toBe(400)
    const metadata = cardTrash.metadata as { cardIds?: number[]; cardTitles?: string[] }
    expect(metadata.cardIds?.length).toBe(handIdsBeforeEnd.length)
    expect(metadata.cardIds ?? []).toEqual(expect.arrayContaining(handIdsBeforeEnd))
    expect(metadata.cardTitles ?? []).toEqual(
      expect.arrayContaining(['被虐のオーラ', '戦いの準備', '天の鎖']),
    )

    const handIdsAfter = (endEntry.postEntrySnapshot?.hand ?? [])
      .map((card) => card.id)
      .filter((id): id is number => typeof id === 'number')
    expect(handIdsAfter).toHaveLength(0)
  })

  it('end-player-turn の card-trash バッチで stage 前は手札に存在し、バッチ適用後に手札から消える', () => {
    const operationLog = buildOperationLog([{ type: 'end-player-turn' }], 0)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog } = replayer.buildActionLog()
    const endEntry = actionLog.toArray().find((entry) => entry.type === 'end-player-turn')
    expect(endEntry).toBeTruthy()
    if (!endEntry) {
      return
    }

    const cardTrashBatch = (endEntry.animationBatches ?? []).find((batch) =>
      (batch.instructions ?? []).some(
        (instruction) => (instruction.metadata as { stage?: string } | undefined)?.stage === 'card-trash',
      ),
    )
    expect(cardTrashBatch).toBeTruthy()
    if (!cardTrashBatch) {
      return
    }

    const cardTrashInstruction = cardTrashBatch.instructions.find(
      (instruction) => (instruction.metadata as { stage?: string } | undefined)?.stage === 'card-trash',
    )
    expect(cardTrashInstruction).toBeTruthy()
    if (!cardTrashInstruction) {
      return
    }
    const metadata = cardTrashInstruction.metadata as { cardIds?: number[] }
    const targetCardIds = metadata.cardIds ?? []
    expect(targetCardIds.length).toBeGreaterThan(0)

    const cardTrashSnapshotHandIds = (cardTrashBatch.snapshot?.hand ?? [])
      .map((card) => card.id)
      .filter((id): id is number => typeof id === 'number')
    expect(cardTrashSnapshotHandIds).not.toEqual(expect.arrayContaining(targetCardIds))

    const patchHandIds = Array.isArray(cardTrashBatch.patch?.changes?.hand)
      ? (cardTrashBatch.patch?.changes?.hand ?? [])
          .map((card) => (card as { id?: number }).id)
          .filter((id): id is number => typeof id === 'number')
      : []
    expect(patchHandIds).not.toEqual(expect.arrayContaining(targetCardIds))

    const endIndex = actionLog.toArray().findIndex((entry) => entry === endEntry)
    const priorStartEntry = actionLog
      .toArray()
      .slice(0, endIndex)
      .findLast((entry) => entry.type === 'start-player-turn')
    expect(priorStartEntry).toBeTruthy()
    if (priorStartEntry?.postEntrySnapshot) {
      const startHandIds = priorStartEntry.postEntrySnapshot.hand
        .map((card) => card.id)
        .filter((id): id is number => typeof id === 'number')
      expect(startHandIds).toEqual(expect.arrayContaining(targetCardIds))
    }
  })

  it('戦闘開始直後にレリック「贄の自覚」を起動すると贄が付与される', () => {
    const operationLog = buildOperationLog(
      [
        {
          type: 'play-relic',
          relicId: 'sacrificial-awareness',
        },
      ],
      0,
    )

    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })

    const { actionLog, finalSnapshot } = replayer.buildActionLog()
    const playRelicEntry = actionLog.toArray().find((entry) => entry.type === 'play-relic')
    expect(playRelicEntry).toBeTruthy()
    if (!playRelicEntry) {
      return
    }

    const instructions =
      (playRelicEntry.animationBatches ?? []).flatMap((batch) => batch.instructions ?? [])
    const stages = instructions
      .map((instruction) => (instruction.metadata as { stage?: string } | undefined)?.stage)
      .filter((stage): stage is string => typeof stage === 'string')
    expect(stages).toContain('relic-activate')

    const sacrificeState = finalSnapshot.snapshot.player.states?.find(
      (state) => state.id === 'state-sacrifice',
    )
    expect(sacrificeState?.magnitude).toBe(1)

    const relicSnapshot = finalSnapshot.snapshot.player.relics.find(
      (relic) => relic.id === 'sacrificial-awareness',
    )
    expect(relicSnapshot?.usesRemaining).toBe(0)
    expect(relicSnapshot?.usable).toBe(false)
  })

  describeAsyncBattle('3秒後に贄の自覚を起動できる', {
    path: '/battle/testcase3',
    waitMsBeforeAction: 3000,
    actions: [
      {
        type: 'click-active-relic',
        relicId: 'sacrificial-awareness',
      },
    ],
    assertions: [
      {
        type: 'expect-player-state',
        stateId: 'state-sacrifice',
        magnitude: 1,
      },
      {
        type: 'expect-relic-usable',
        relicId: 'sacrificial-awareness',
        usable: false,
        usesRemaining: 0,
      },
    ],
  })
})
