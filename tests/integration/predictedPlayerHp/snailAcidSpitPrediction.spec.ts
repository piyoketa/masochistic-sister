import { describe, it, expect } from 'vitest'

import { OperationLogReplayer } from '@/domain/battle/OperationLogReplayer'
import { ActionLogReplayer } from '@/domain/battle/ActionLogReplayer'
import { createTestCaseBattle } from '@/domain/battle/battlePresets'
import { buildEnemyActionHintsForView, formatEnemyActionChipsForView } from '@/view/enemyActionHintsForView'
import type { Battle, BattleSnapshot } from '@/domain/battle/Battle'
import type { EnemyActionChipViewModel } from '@/types/enemyActionChip'
import { buildOperationLog, type OperationLogEntryConfig } from '../utils/battleLogTestUtils'
import { requireEnemyId } from '../utils/scenarioEntityUtils'

/*
テストシナリオ:
/battle/testcase1 の開始直後、プレイヤーがターン終了し、敵ターンで「かたつむり」が初手「溶かす」を実行する。
EnemyNextActions.vue が参照する EnemyActionChipViewModel を生成し、行動直前は5ダメージであることと、
溶かすのBattleActionLogEntry処理タイミングでも「行動開始時の状態異常」を使うため5のままになることを確認する。
*/

const battleFactory = () => createTestCaseBattle()

const operationEntries: OperationLogEntryConfig[] = [
  {
    // プレイヤーが「ターン終了」ボタンを押す操作に相当し、直後に敵ターンの行動アニメーションが開始される。
    type: 'end-player-turn',
  },
]

describe('敵行動予測: かたつむり溶かす中の打点変化', () => {
  it('溶かすのenemy-act処理タイミングでも表示打点が5のままになる', () => {
    const operationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog } = replayer.buildActionLog()

    const entries = actionLog.toArray()
    const endPlayerTurnIndex = entries.findIndex((entry) => entry.type === 'end-player-turn')
    expect(endPlayerTurnIndex).toBeGreaterThanOrEqual(0)
    if (endPlayerTurnIndex < 0) {
      return
    }
    const endPlayerTurnEntry = actionLog.at(endPlayerTurnIndex)
    const endPlayerTurnSnapshot = endPlayerTurnEntry?.postEntrySnapshot
    expect(endPlayerTurnSnapshot).toBeTruthy()
    if (!endPlayerTurnSnapshot) {
      return
    }

    const acidSpitIndex = entries.findIndex(
      (entry) => entry.type === 'enemy-act' && entry.actionName === '溶かす',
    )
    expect(acidSpitIndex).toBeGreaterThanOrEqual(0)
    if (acidSpitIndex < 0) {
      return
    }

    const actionReplayer = new ActionLogReplayer({
      createBattle: battleFactory,
      actionLog,
    })

    // 直前（プレイヤーターン終了直後）のスナップショットでは、溶かすの予測打点は5であること。
    const beforeResult = actionReplayer.run(endPlayerTurnIndex)
    const beforeSnapshot = endPlayerTurnSnapshot
    const snailId = requireEnemyId(beforeSnapshot.enemies, 'かたつむり')
    const playerStatesAtActionStart = beforeSnapshot.player.states.map((state) => ({ ...state }))
    const beforeChip = buildEnemyActionChip({
      battle: beforeResult.battle,
      snapshot: beforeSnapshot,
      enemyId: snailId,
    })
    expect(beforeChip?.title).toBe('溶かす')
    expect(beforeChip?.damage?.amount).toBe(5)

    const acidSpitEntry = actionLog.at(acidSpitIndex)
    expect(acidSpitEntry?.type).toBe('enemy-act')
    if (!acidSpitEntry || acidSpitEntry.type !== 'enemy-act') {
      return
    }

    // enemy-act の最初のバッチは「敵ハイライト」演出であり、EnemyNextActionsが参照する更新タイミングに一致する。
    const highlightBatch = acidSpitEntry.animationBatches?.[0]
    expect(highlightBatch).toBeTruthy()
    if (!highlightBatch) {
      return
    }
    const highlightStage = highlightBatch.instructions?.[0]?.metadata as { stage?: string } | undefined
    expect(highlightStage?.stage).toBe('enemy-highlight')

    const duringResult = actionReplayer.run(acidSpitIndex)
    const duringChip = buildEnemyActionChip({
      battle: duringResult.battle,
      snapshot: highlightBatch.snapshot,
      enemyId: snailId,
      // 敵行動中だけ「行動開始時のプレイヤー状態異常」を使う例外表示を再現する。
      actingEnemyId: snailId,
      playerStatesAtActionStart,
    })
    expect(duringChip?.title).toBe('溶かす')
    expect(duringChip?.damage?.amount).toBe(5)
  })
})

function buildEnemyActionChip(params: {
  battle: Battle
  snapshot: BattleSnapshot
  enemyId: number
  actingEnemyId?: number
  playerStatesAtActionStart?: BattleSnapshot['player']['states']
}): EnemyActionChipViewModel | undefined {
  // EnemyNextActions.vue と同じ経路で予測表示のチップを構築する。
  const hintsByEnemy = buildEnemyActionHintsForView({
    battle: params.battle,
    snapshot: params.snapshot,
    actingEnemyId: params.actingEnemyId ?? null,
    playerStatesAtActionStart: params.playerStatesAtActionStart,
  })
  const hints = hintsByEnemy.get(params.enemyId) ?? []
  const chips = formatEnemyActionChipsForView(params.enemyId, hints)
  return chips[0]
}
