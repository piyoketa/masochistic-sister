import { describe, it, expect, beforeAll, afterAll } from 'vitest'
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
import {
  buildOperationLog,
  summarizeActionLogEntry,
  type OperationLogEntryConfig,
} from './utils/battleLogTestUtils'
import { HAND_RULE_EXPERIMENTAL_END_PLAYER_TURN } from '../fixtures/handRuleExperimentalEndTurn'

// experimental hand rule: 初期0枚、ターン開始4枚、ターン終了で状態異常以外を捨て札
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

const operationEntries: OperationLogEntryConfig[] = [{ type: 'end-player-turn' }]

describe('手札ルール: experimental（ターン終了時に手札を捨て札）', () => {
  const originalEnv = process.env.EXPERIMENT_HAND_RULE

  beforeAll(() => {
    process.env.EXPERIMENT_HAND_RULE = 'true'
  })

  afterAll(() => {
    process.env.EXPERIMENT_HAND_RULE = originalEnv
  })

  it('end-player-turn の ActionLog に card-trash ステージが含まれる', () => {
    // 最初のターン終了までの OperationLog を適用
    const operationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog } = replayer.buildActionLog()
    const endTurnEntry = actionLog.toArray().find((entry) => entry.type === 'end-player-turn')
    expect(endTurnEntry).toBeTruthy()
    if (!endTurnEntry) {
      return
    }
    // end-player-turn のActionLog全体をフィクスチャと比較し、card-trashステージの内容を固定化する
    const summary = summarizeActionLogEntry(endTurnEntry)
    expect(summary).toEqual(HAND_RULE_EXPERIMENTAL_END_PLAYER_TURN)
  })
})
