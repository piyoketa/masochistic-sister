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
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { OrcSumoEnemy } from '@/domain/entities/enemies/OrcSumoEnemy'
import { KamaitachiEnemy } from '@/domain/entities/enemies/KamaitachiEnemy'
import { HummingbirdEnemy } from '@/domain/entities/enemies/HummingbirdEnemy'
import { SlugEnemy } from '@/domain/entities/enemies/SlugEnemy'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { buildOperationLog, type OperationLogEntryConfig } from './utils/battleLogTestUtils'
import { requireEnemyId } from './utils/scenarioEntityUtils'

/**
 * 行動順に合わせて決まった乱数を返すジェネレーター。
 * 追い風を確定で選び、次の呼び出しで対象抽選を「オーク力士」に寄せるための制御。
 */
function createSequencedRng(sequence: number[], fallback = 0.5): () => number {
  let cursor = 0
  return () => {
    const value = sequence[cursor]
    cursor += 1
    return typeof value === 'number' ? value : fallback
  }
}

// 敵編成をハードコーディングし、再現性のある形で「ハチドリがオーク力士へ追い風」を発生させる。
const battleFactory = () => {
  const enemyTeam = new EnemyTeam({
    id: 'hummingbird-allies',
    members: [
      // オーク力士: ターゲット候補として確実に存在させるだけなので行動は固定で十分。
      new OrcSumoEnemy({
        rng: () => 0, // 初手行動を安定させ、テストの焦点を追い風の挙動だけに絞る。
      }),
      // かまいたち: 追い風を撃たせないよう初手をフレイルに固定し、加速付与の重複を避ける。
      new KamaitachiEnemy({
        rng: () => 0,
      }),
      // ハチドリ: 1回目の乱数で行動選択（0.9 → 追い風）、2回目で対象抽選（0.1 → オーク力士）を指示。
      new HummingbirdEnemy({
        rng: createSequencedRng([0.9, 0.1]),
      }),
      new SlugEnemy({
        rng: () => 0,
      }),
    ],
  })

  return new Battle({
    id: 'battle-scenario-4',
    cardRepository: new CardRepository(),
    player: new ProtagonistPlayer(),
    enemyTeam,
    deck: new Deck(),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
    relicClassNames: [],
  })
}

// 操作キュー: プレイヤー操作は行わず即ターン終了→敵ターンのアニメーションを再生させる。
const operationEntries: OperationLogEntryConfig[] = [
  {
    type: 'end-player-turn',
  },
]

describe('シナリオ4: ハチドリの追い風でオーク力士を加速', () => {
  it('ハチドリが追い風を発動した直後にオーク力士へ加速(1)が付与される', () => {
    const operationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
    const replayer = new OperationLogReplayer({
      createBattle: battleFactory,
      operationLog,
    })
    const { actionLog, initialSnapshot, finalSnapshot } = replayer.buildActionLog()

    const initialEnemies = initialSnapshot.snapshot.enemies
    const orcSumoId = requireEnemyId(initialEnemies, 'オーク力士')
    const hummingbirdId = requireEnemyId(initialEnemies, 'ハチドリ')

    // 追い風演出（enemy-act）を特定し、そのバッチ直後のスナップショットを検証する。
    const tailwindEntry = actionLog
      .toArray()
      .find(
        (entry) =>
          entry.type === 'enemy-act' &&
          entry.enemyId === hummingbirdId &&
          entry.actionName === '追い風',
      )

    expect(tailwindEntry).toBeTruthy()
    if (!tailwindEntry) {
      return
    }

    const snapshotAfterTailwind = tailwindEntry.postEntrySnapshot
    expect(snapshotAfterTailwind).toBeTruthy()
    if (!snapshotAfterTailwind) {
      return
    }

    const orcAfterTailwind = snapshotAfterTailwind.enemies.find((enemy) => enemy.id === orcSumoId)
    expect(orcAfterTailwind).toBeTruthy()
    const accelerationState = orcAfterTailwind?.states.find((state) => state.id === 'state-acceleration')
    expect(accelerationState?.magnitude).toBe(1)

    // 敵ターンを全て再生し切っても加速が残っていることを確認し、付与がロールバックされないことを保証する。
    const finalOrc = finalSnapshot.snapshot.enemies.find((enemy) => enemy.id === orcSumoId)
    expect(finalOrc?.states.some((state) => state.id === 'state-acceleration')).toBe(true)
  })
})
