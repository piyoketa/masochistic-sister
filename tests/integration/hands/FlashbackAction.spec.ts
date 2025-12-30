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
import type { BattleSnapshot } from '@/domain/battle/Battle'
import { Card } from '@/domain/entities/Card'
import { CardRepository } from '@/domain/repository/CardRepository'
import { FlashbackAction } from '@/domain/entities/actions/FlashbackAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { buildTutorialDeck } from '@/domain/entities/decks'
import { TutorialEnemyTeam } from '@/domain/entities/enemyTeams'
import { TargetEnemyOperation } from '@/domain/entities/operations'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'
import { buildOperationLog, type OperationLogEntryConfig } from '../utils/battleLogTestUtils'
import { requireCardId } from '../utils/scenarioEntityUtils'

// チュートリアルデッキの4枚初期ドローのうち1枚を FlashbackAction に差し替え、手札表示の有効/無効状態を検証する。
const battleFactory = () => {
  const cardRepository = new CardRepository()
  const tutorialDeck = buildTutorialDeck(cardRepository)
  const flashbackCard = cardRepository.create(() => new Card({ action: new FlashbackAction() }))

  // 初期ドロー4枚に確実に含まれるよう、最初の「戦いの準備」を蘇る記憶に差し替える。
  const deck = [...tutorialDeck.deck]
  const prepIndex = deck.findIndex((card) => card.title === '戦いの準備')
  if (prepIndex >= 0) {
    deck[prepIndex] = flashbackCard
  }

  return new Battle({
    id: 'battle-flashback-tutorial',
    cardRepository,
    player: new ProtagonistPlayer(),
    enemyTeam: new TutorialEnemyTeam(),
    deck: new Deck(deck),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

// 1. 被虐のオーラをプレイして敵を即行動させ、記憶カード（攻撃）を獲得する
// 2. 獲得した記憶攻撃を使用して捨て札へ送る
const operationEntries: OperationLogEntryConfig[] = [
  {
    type: 'play-card',
    card: (battle) =>
      requireCardId(battle.hand.list().find((card) => card.title === '被虐のオーラ')),
    operations: [
      {
        type: TargetEnemyOperation.TYPE,
        payload: (battle) => requireEnemyIdByName(battle, 'なめくじ'),
      },
    ],
  },
  {
    type: 'play-card',
    card: (battle) => requireCardId(findMemoryAttackInHand(battle)),
    operations: [
      {
        type: TargetEnemyOperation.TYPE,
        payload: (battle) => requireEnemyIdByName(battle, 'なめくじ'),
      },
    ],
  },
]

describe('FlashbackAction: チュートリアル手札での有効/無効表示', () => {
  it('ターン開始直後は捨て札に攻撃が無いためコスト表示が card-cost--unavailable になる', () => {
    const operationLog = buildOperationLog([], -1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog } = replayer.buildActionLog()

    const startTurnEntry = actionLog.toArray().find((entry) => entry.type === 'start-player-turn')
    expect(startTurnEntry).toBeTruthy()
    const snapshot = startTurnEntry?.postEntrySnapshot
    expect(snapshot).toBeTruthy()
    if (!snapshot) {
      return
    }

    const flashbackCard = snapshot.hand.find((card) => card.title === '蘇る記憶')
    expect(flashbackCard).toBeTruthy()
    if (!flashbackCard) {
      return
    }
    expect((flashbackCard as any).runtimeActive ?? flashbackCard.getRuntimeActive?.()).toBe(false)

    const flashbackCostUnavailable = isCostUnavailable(snapshot, '蘇る記憶')
    expect(flashbackCostUnavailable).toBe(true)
  })

  it('記憶化した攻撃を捨て札へ送った後は card-cost--unavailable が外れる', () => {
    const operationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog } = replayer.buildActionLog()

    // 2番目の play-card（記憶攻撃使用）後のスナップショットを参照
    const playEntries = actionLog.toArray().filter((entry) => entry.type === 'play-card')
    expect(playEntries.length).toBeGreaterThanOrEqual(2)
    const lastPlaySnapshot = playEntries.at(-1)?.postEntrySnapshot
    expect(lastPlaySnapshot).toBeTruthy()
    if (!lastPlaySnapshot) {
      return
    }

    // 確認: 捨て札に attack タイプが存在すること（フラッシュバックが有効化される前提）
    const discardHasAttack = lastPlaySnapshot.discardPile.some(
      (card) => card.definition.cardType === 'attack',
    )
    expect(discardHasAttack).toBe(true)

    const flashbackCostUnavailable = isCostUnavailable(lastPlaySnapshot, '蘇る記憶')
    expect(flashbackCostUnavailable).toBe(false)
  })
})

function isCostUnavailable(snapshot: BattleSnapshot, title: string): boolean {
  const flashback = snapshot.hand.find((card) => card.title === title)
  expect(flashback).toBeTruthy()
  if (!flashback) {
    return false
  }

  // BattleSnapshot に含まれる runtimeActive / runtimeCost をそのまま UI の判定に使う。
  const resolvedCost = (flashback as any).runtimeCost ?? flashback.cost
  const affordable = resolvedCost <= snapshot.player.currentMana
  // isActive は Battle 依存なので、スナップショットから必要最小限のハンド/捨て札情報だけを持つダミー Battle を渡す。
  const activeContext = {
    battle: {
      hand: { isAtLimit: () => snapshot.hand.length >= 10 },
      discardPile: { list: () => [...snapshot.discardPile] },
    } as unknown as Battle,
  }
  const cardInfo = buildCardInfoFromCard(flashback, { affordable, activeContext })
  expect(cardInfo).toBeTruthy()
  if (!cardInfo) {
    return false
  }
  return cardInfo.affordable === false || cardInfo.disabled === true
}

function requireEnemyIdByName(battle: Battle, name: string): number {
  const enemy = battle.enemyTeam.members.find((candidate) => candidate.name === name)
  const id = enemy?.id
  if (id === undefined) {
    throw new Error(`敵 ${name} のIDを取得できませんでした`)
  }
  return id
}

function findMemoryAttackInHand(battle: Battle): Card | undefined {
  return battle.hand.list().find((card) => card.hasTag('tag-memory'))
}
