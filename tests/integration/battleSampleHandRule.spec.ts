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
import { buildOperationLog, type OperationLogEntryConfig } from './utils/battleLogTestUtils'

// 手札ルールのデフォルト挙動を検証するためのテスト用 Battle。
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

describe('手札ルール: experimental をデフォルトで適用する', () => {
  it('戦闘開始直後のターン開始ドローが4枚になる', () => {
    // 操作ログを空にして初期化時の挙動だけを確認する
    const operationLog = buildOperationLog([], -1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { battle, actionLog } = replayer.buildActionLog()
    const startTurnEntry = actionLog.toArray().find((entry) => entry.type === 'start-player-turn')
    expect(startTurnEntry?.draw ?? 0).toBe(4)
    expect(battle.hand.list().length).toBe(4)
  })

  it('end-player-turn の ActionLog に card-trash ステージが含まれ、非状態異常カードが捨て札に送られる', () => {
    // 最初のターン終了までの OperationLog を適用
    const operationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog, battle } = replayer.buildActionLog()
    const endTurnEntry = actionLog.toArray().find((entry) => entry.type === 'end-player-turn')
    expect(endTurnEntry).toBeTruthy()
    if (!endTurnEntry) {
      return
    }
    const startTurnEntry = actionLog.toArray().find((entry) => entry.type === 'start-player-turn')
    const startHandIds = startTurnEntry?.postEntrySnapshot?.hand
      ?.map((card) => card.id)
      .filter((id): id is number => typeof id === 'number') ?? []
    const trashInstructions = (endTurnEntry.animationBatches ?? [])
      .flatMap((batch) => batch.instructions ?? [])
      .filter((instruction) => {
        const stage = (instruction.metadata as { stage?: string } | undefined)?.stage
        return stage === 'card-trash' || stage === 'card-eliminate'
      })
    expect(trashInstructions.length).toBeGreaterThan(0)
    const discardedIds =
      trashInstructions.flatMap((instruction) => {
        const metadata = instruction.metadata as { cardIds?: number[] } | undefined
        return metadata?.cardIds ?? []
      }) ?? []
    // 初期ドロー4枚すべてが非状態異常なので、そのまま捨て札へ移動する想定（敵の行動で新規カードが手札に増える点に注意）
    expect(discardedIds.length).toBeGreaterThanOrEqual(4)
    const postHandIds = battle.hand.list().map((card) => card.id).filter((id): id is number => typeof id === 'number')
    startHandIds.forEach((id) => {
      expect(postHandIds.includes(id)).toBe(false)
    })
    const discardIds = battle.discardPile.list().map((card) => card.id).filter((id): id is number => typeof id === 'number')
    startHandIds.forEach((id) => {
      expect(discardIds.includes(id)).toBe(true)
    })
  })
})
