import { describe, it, expect } from 'vitest'

import { OperationLogReplayer } from '@/domain/battle/OperationLogReplayer'
import { createTestCaseBattle } from '@/domain/battle/battlePresets'
import { TargetEnemyOperation } from '@/domain/entities/operations'
import type { Battle } from '@/domain/battle/Battle'
import { buildOperationLog, type OperationLogEntryConfig } from '../utils/battleLogTestUtils'
import { findMemoryCardId, requireCardId } from '../utils/scenarioEntityUtils'

// テストシナリオ:
// /battle/testcase1 で「被虐のオーラ」を触手へ撃ち、即時行動で生成された記憶カード「体液をかける」を続けて使用する。
// 実際の画面ではこの操作の後にpredictedPlayerHpAfterEndTurnが消えることがあったため、
// OperationRunnerが再計算した予測値がスナップショットに保持され続けることを検証する。

const battleFactory = () => createTestCaseBattle()

const operationEntries: OperationLogEntryConfig[] = [
  {
    type: 'play-card',
    card: (battle) =>
      requireCardId(
        battle.hand.list().find((card) => card.title === '被虐のオーラ'),
        '初手の被虐のオーラ',
      ),
    operations: [
      {
        type: TargetEnemyOperation.TYPE,
        payload: (battle) => requireEnemyIdByName(battle, '触手'),
      },
    ],
  },
  {
    type: 'play-card',
    // 被虐のオーラ直後に生成された記憶攻撃「体液をかける」を対象にする
    card: (battle) => findMemoryCardId(battle, '体液をかける'),
    operations: [
      {
        type: TargetEnemyOperation.TYPE,
        payload: (battle) => requireEnemyIdByName(battle, '触手'),
      },
    ],
  },
]

describe('予測HP: 記憶攻撃使用後も表示が残ること', () => {
  it('被虐のオーラ→記憶の体液をかける使用後のスナップショットでpredictedPlayerHpAfterEndTurnが数値のまま', () => {
    const operationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog, finalSnapshot } = replayer.buildActionLog()

    const playEntries = actionLog.toArray().filter((entry) => entry.type === 'play-card')
    expect(playEntries.length).toBeGreaterThanOrEqual(2)
    const memoryPlaySnapshot = playEntries.at(1)?.postEntrySnapshot
    expect(memoryPlaySnapshot).toBeTruthy()
    if (!memoryPlaySnapshot) {
      return
    }

    // バグ再発防止: 記憶攻撃使用後も予測HPが数値で保持され、表示判定がtrueになることを確認する
    expect(typeof memoryPlaySnapshot.player.predictedPlayerHpAfterEndTurn).toBe('number')

    // 直後のフルスナップショットでも予測値が欠落していないことを二重に確認する
    expect(typeof finalSnapshot.snapshot.player.predictedPlayerHpAfterEndTurn).toBe('number')
  })
})

function requireEnemyIdByName(battle: Battle, name: string): number {
  const enemy = battle.enemyTeam.members.find((candidate) => candidate.name === name)
  const id = enemy?.id
  if (id === undefined) {
    throw new Error(`敵 ${name} のIDを取得できませんでした`)
  }
  return id
}
