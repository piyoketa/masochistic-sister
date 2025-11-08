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
import { buildTestDeck } from '@/domain/entities/decks'
import { TestEnemyTeam } from '@/domain/entities/enemyTeams'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { CardRepository } from '@/domain/repository/CardRepository'
import { ACTION_LOG_SUMMARY } from '../fixtures/battleSampleExpectedActionLog'
import {
  buildOperationLog,
  summarizeActionLogEntry,
  type ActionLogEntrySummary,
  type OperationLogEntryConfig,
} from './utils/battleLogTestUtils'
import {
  collectCardIdsByTitle,
  findMemoryCardId,
  findStatusCardId,
  requireCardId,
  requireEnemyId,
} from './utils/scenarioEntityUtils'

const EXPECTED_ACTION_LOG_SUMMARY: ActionLogEntrySummary[] = ACTION_LOG_SUMMARY

const battleFactory = () => {
  const cardRepository = new CardRepository()
  const defaultDeck = buildTestDeck(cardRepository)
  return new Battle({
    id: 'battle-1',
    cardRepository,
    player: new ProtagonistPlayer(),
    enemyTeam: new TestEnemyTeam(),
    deck: new Deck(defaultDeck.deck),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

const references = collectScenarioReferences(battleFactory().getSnapshot())
const operationEntries = buildOperationEntries(references)

const OPERATION_EXPECTATIONS = [
  { name: '被虐のオーラでかたつむりの攻撃を即時発生', lastActionIndex: 2 },
  { name: '日課でデッキトップから2枚を補充', lastActionIndex: 3 },
  { name: '戦いの準備で次ターンのマナを予約', lastActionIndex: 4 },
  { name: 'ターン終了 → 敵行動と次ターン開始まで', lastActionIndex: 11 },
  { name: 'たいあたり(記憶)でかたつむりへ反撃', lastActionIndex: 12 },
  { name: '酸を吐く(記憶)で触手へ腐食付与', lastActionIndex: 13 },
  { name: '粘液飛ばし(記憶)で触手を撃破', lastActionIndex: 14 },
  { name: '腐食カードを使用', lastActionIndex: 15 },
  { name: 'ターン終了 → 敵行動第2セット', lastActionIndex: 21 },
  { name: '疼きで乱れ突き(5×5)を選択', lastActionIndex: 22 },
  { name: '乱れ突き(10×4)でオークを撃破', lastActionIndex: 23 },
  { name: '乱れ突き(被弾記憶)連打で勝利', lastActionIndex: 25 },
] as const

if (process.env.LOG_BATTLE_SAMPLE1_SUMMARY === '1') {
  const fullOperationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
  const replayer = new OperationLogReplayer({
    createBattle: battleFactory,
    operationLog: fullOperationLog,
  })
  const { actionLog } = replayer.buildActionLog()
  const summary = actionLog.toArray().map(summarizeActionLogEntry)
  // eslint-disable-next-line no-console
  console.log('BATTLE_SAMPLE1_ACTION_LOG_SUMMARY', JSON.stringify(summary, null, 2))
  operationEntries.forEach((_, index) => {
    const partialLog = buildOperationLog(operationEntries, index)
    const partialReplayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog: partialLog,
    })
    const { actionLog: partialActionLog } = partialReplayer.buildActionLog()
    // eslint-disable-next-line no-console
    console.log(
      'BATTLE_SAMPLE1_OPERATION',
      index + 1,
      'lastActionIndex',
      partialActionLog.toArray().length - 1,
    )
  })
}

describe('シナリオ1: OperationLog → ActionLog + AnimationInstruction', () => {
  OPERATION_EXPECTATIONS.forEach(({ name, lastActionIndex }, operationIndex) => {
    it(`${operationIndex + 1}. ${name}`, () => {
      const operationLog = buildOperationLog(operationEntries, operationIndex)
      const replayer = new OperationLogReplayer({
        createBattle: battleFactory,
        operationLog,
      })
      const { actionLog } = replayer.buildActionLog()
      const actualSummary = actionLog.toArray().map(summarizeActionLogEntry)
      expect(actualSummary.slice(0, lastActionIndex + 1)).toEqual(
        EXPECTED_ACTION_LOG_SUMMARY.slice(0, lastActionIndex + 1),
      )
    })
  })
})

function collectScenarioReferences(snapshot: Awaited<ReturnType<Battle['getSnapshot']>>) {
  const heavenChainIds = collectCardIdsByTitle(snapshot.deck, '天の鎖')
  const masochisticAuraIds = collectCardIdsByTitle(snapshot.deck, '被虐のオーラ')
  return {
    masochisticAuraIds: masochisticAuraIds.slice(0, 2) as [number, number],
    heavenChainIds: heavenChainIds.slice(0, 4) as [number, number, number, number],
    battlePrepId: requireCardId(snapshot.deck.find((card) => card.title === '戦いの準備')),
    dailyRoutineId: requireCardId(snapshot.deck.find((card) => card.title === '日課')),
    acheId: requireCardId(snapshot.deck.find((card) => card.title === '疼き')),
    enemyIds: {
      orc: requireEnemyId(snapshot.enemies, 'オーク'),
      orcDancer: requireEnemyId(snapshot.enemies, 'オークダンサー'),
      tentacle: requireEnemyId(snapshot.enemies, '触手'),
      snail: requireEnemyId(snapshot.enemies, 'かたつむり'),
    },
  }
}

function buildOperationEntries(references: ReturnType<typeof collectScenarioReferences>) {
  const entries: OperationLogEntryConfig[] = []
  entries.push({
    type: 'play-card',
    card: references.masochisticAuraIds[0],
    operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
  })
  entries.push({
    type: 'play-card',
    card: references.dailyRoutineId,
  })
  entries.push({
    type: 'play-card',
    card: references.battlePrepId,
  })
  entries.push({ type: 'end-player-turn' })
  entries.push({
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, 'たいあたり'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.snail }],
  })
  entries.push({
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '酸を吐く'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.tentacle }],
  })
  entries.push({
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '粘液飛ばし'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.tentacle }],
  })
  entries.push({
    type: 'play-card',
    card: (battle) => findStatusCardId(battle, '腐食'),
  })
  entries.push({ type: 'end-player-turn' })
  entries.push({
    type: 'play-card',
    card: references.acheId,
    operations: [
      {
        type: 'select-hand-card',
        payload: (battle) => findMemoryCardId(battle, '乱れ突き'),
      },
    ],
  })
  entries.push({
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '乱れ突き'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.orc }],
  })
  entries.push({
    type: 'play-card',
    card: (battle) => findMemoryCardId(battle, '乱れ突き'),
    operations: [{ type: 'target-enemy', payload: references.enemyIds.orcDancer }],
  })
  return entries
}
