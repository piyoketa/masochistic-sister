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
import { Card } from '@/domain/entities/Card'
import { CardRepository } from '@/domain/repository/CardRepository'
import { FlashbackAction } from '@/domain/entities/actions/FlashbackAction'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { DailyRoutineAction } from '@/domain/entities/actions/DailyRoutineAction'
import { MasochisticAuraAction } from '@/domain/entities/actions/MasochisticAuraAction'
import { TestEnemyTeam } from '@/domain/entities/enemyTeams'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { buildOperationLog, type OperationLogEntryConfig } from './utils/battleLogTestUtils'

/**
 * 捨て札に攻撃カード（被虐の記憶）を温存した状態で、手札にある「蘇る記憶」がアクティブ扱いになることを検証する。
 * - 初期手札に「蘇る記憶」をセットし、デッキからの通常ドローで手札を埋める。
 * - 捨て札には attack タイプのカードを直接配置し、ターン開始時点で条件を満たしていることを固定する。
 */
const battleFactory = () => {
  const cardRepository = new CardRepository()
  const create = <T extends Card>(factory: () => T) => cardRepository.create(factory)

  // プレイヤー操作前に手札へ持っておくスキルカード
  const flashbackCard = create(() => new Card({ action: new FlashbackAction() }))

  // 捨て札に積んでおく被虐の記憶（attack タイプであればよい）
  const painfulMemory = create(() => new Card({ action: new TackleAction() }))

  // ターン開始時ドローで引かせるだけのフィラー。攻撃でないカードを4枚積んで、捨て札からの再シャッフルを防ぐ。
  const deckCards = [
    create(() => new Card({ action: new BattlePrepAction() })),
    create(() => new Card({ action: new DailyRoutineAction() })),
    create(() => new Card({ action: new MasochisticAuraAction() })),
    create(() => new Card({ action: new DailyRoutineAction() })),
  ]

  return new Battle({
    id: 'battle-scenario-5',
    cardRepository,
    player: new ProtagonistPlayer(),
    enemyTeam: new TestEnemyTeam(),
    deck: new Deck(deckCards),
    hand: new Hand([flashbackCard]),
    discardPile: new DiscardPile([painfulMemory]),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

// 操作キュー: プレイヤー操作は一切行わず、バトル開始〜ターン開始の自動演出だけを再生する。
const operationEntries: OperationLogEntryConfig[] = []

describe('シナリオ5: 捨て札の被虐の記憶で蘇る記憶が有効化される', () => {
  it('捨て札に攻撃カードが1枚でもあれば、手札の「蘇る記憶」の runtimeActive が true になる', () => {
    // 操作ログは空なので、バトル開始とターン開始のアニメーションのみを適用する想定。
    const operationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog } = replayer.buildActionLog()

    const startTurnEntry = actionLog.toArray().find((entry) => entry.type === 'start-player-turn')
    expect(startTurnEntry).toBeTruthy()
    if (!startTurnEntry?.postEntrySnapshot) {
      return
    }

    // 表示用スナップショット上で、捨て札に attack タイプが確実に残っていることを前提条件として確認する。
    const discardAttackCards = startTurnEntry.postEntrySnapshot.discardPile.filter(
      (card) => card.definition.cardType === 'attack',
    )
    expect(discardAttackCards.length).toBeGreaterThan(0)

    // 手札にある「蘇る記憶」がアクティブ表示になることを確認する（runtimeActive=true で UI 上は使用可能）。
    const flashbackInHand = startTurnEntry.postEntrySnapshot.hand.find(
      (card) => card.title === '蘇る記憶',
    )
    expect(flashbackInHand).toBeTruthy()
    if (!flashbackInHand) {
      return
    }
    expect(flashbackInHand.getRuntimeActive()).toBe(true)
  })
})
