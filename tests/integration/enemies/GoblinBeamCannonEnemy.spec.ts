/*
GoblinBeamCannonEnemy.spec.ts の責務:
- ビーム砲ゴブリンの5本脚スタン耐性が、複数ヒット攻撃で破られた際の挙動を統合テストで検証する。
- スタン成立後に行動予定が正しく足止め（SkipTurnAction）へ差し替わること、および次ターン開始時のスタンカウント再付与が期待値どおりであることを確認する。

責務ではないこと:
- 個別のStateやActionの単体ロジック検証（それらは専用のunit/domainテストで扱う）。
- 描画やアニメーションの詳細検証。ここではActionLogに含まれるスナップショットの整合性のみを見る。

主要な通信相手とインターフェース:
- `OperationLogReplayer`: OperationLogを再生し、ActionLogとスナップショットを生成する。`buildActionLog`で Battle を構築し、`actionLog` / `finalSnapshot` を参照する。
- `Battle`: バトル進行の実体。デッキや敵チームを初期化し、`turnPosition` や `enemyTeam.members` からID解決を行う。
- `CardRepository`: テスト用の5連撃攻撃カードをID付きで生成し、`Hand`/`Deck`に供給する。
*/
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
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { Damages } from '@/domain/entities/Damages'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { GoblinBeamCannonEnemy } from '@/domain/entities/enemies/GoblinBeamCannonEnemy'
import { TargetEnemyOperation } from '@/domain/entities/operations'
import { buildOperationLog, type OperationLogEntryConfig } from '../utils/battleLogTestUtils'
import { requireCardId } from '../utils/scenarioEntityUtils'

const TEST_ATTACK_TITLE = '5連撃テスト'

function createFiveHitAttackCard(repository: CardRepository): Card {
  // 5ヒット×5ダメージ（連続攻撃カテゴリはDamages.typeで指定）のカードを生成し、テスト中は確実に手札へ来るようデッキに複数枚積む
  const damages = new Damages({
    baseAmount: 5,
    baseCount: 5,
    type: 'multi',
    cardId: 'test-flurry-5x5',
  })
  const action = new FlurryAction().cloneWithDamages(damages, {
    name: TEST_ATTACK_TITLE,
    cardDefinition: {
      title: TEST_ATTACK_TITLE,
      cost: 0,
    },
  })
  return repository.create(() => new Card({ action }))
}

function buildTestBattle(): Battle {
  const cardRepository = new CardRepository()
  // 初期ドロー（3枚）＋ターン開始ドロー（4枚）をすべて5連撃カードで埋め、ターゲット選択のみでテストシナリオを再現する
  const deckCards = Array.from({ length: 7 }, () => createFiveHitAttackCard(cardRepository))
  const enemyTeam = new EnemyTeam({
    id: 'enemy-team-goblin-beam-test',
    members: [
      new GoblinBeamCannonEnemy({
        rng: () => 0, // 行動抽選を固定化し、差し替え後の予定がブレないようにする
      }),
    ],
  })

  return new Battle({
    id: 'battle-goblin-beam-stun',
    cardRepository,
    player: new ProtagonistPlayer(),
    enemyTeam,
    deck: new Deck(deckCards),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

function requireGoblinBeamId(battle: Battle): number {
  const goblin = battle.enemyTeam.members.find((enemy) => enemy.name === 'ビーム砲')
  const id = goblin?.id
  if (id === undefined) {
    throw new Error('ビーム砲の敵IDが取得できませんでした')
  }
  return id
}

// 操作シナリオ:
// 1. プレイヤーが5連撃カードをビーム砲に使用（5ヒットでスタンカウントを0にする想定）
// 2. そのままターン終了し、敵行動（足止め演出）と次ターン開始までを再生する
const operationEntries: OperationLogEntryConfig[] = [
  {
    type: 'play-card',
    card: (battle) =>
      requireCardId(
        battle.hand.list().find((card) => card.title === TEST_ATTACK_TITLE),
        TEST_ATTACK_TITLE,
      ),
    operations: [
      {
        type: TargetEnemyOperation.TYPE,
        payload: (battle) => requireGoblinBeamId(battle),
      },
    ],
  },
  { type: 'end-player-turn' },
]

describe('GoblinBeamCannonEnemy のスタン挙動', () => {
  it('5×5攻撃後にスタンして足止め行動へ置換され、次ターン開始時にスタンカウント10が付与される', () => {
    const operationLog = buildOperationLog(operationEntries, operationEntries.length - 1)
    const replayer = new OperationLogReplayer({
      createBattle: buildTestBattle,
      operationLog,
    })
    const { actionLog } = replayer.buildActionLog()

    const playEntry = actionLog.toArray().find((entry) => entry.type === 'play-card')
    expect(playEntry?.postEntrySnapshot).toBeTruthy()
    const afterAttackSnapshot = playEntry?.postEntrySnapshot
    const goblinAfterAttack = afterAttackSnapshot?.enemies.find((enemy) => enemy.name === 'ビーム砲')
    expect(goblinAfterAttack).toBeTruthy()
    if (!afterAttackSnapshot || !goblinAfterAttack) {
      return
    }

    // スタンカウントが0になり、そのターン中の状態リストから除去されていること
    const stunAfterAttack = goblinAfterAttack.states.find((state) => state.id === 'state-stun-count')
    expect(stunAfterAttack).toBeUndefined()

    // 次行動（turn=現在ターン）が SkipTurnAction に差し替わっていること
    const stunnedTurn = afterAttackSnapshot.turnPosition.turn
    const plannedAction = goblinAfterAttack.plannedActions?.find((plan) => plan.turn === stunnedTurn)
    expect(plannedAction?.actionType).toBe('skip')
    expect(plannedAction?.actionName).toBe('天の鎖')

    // FiveLegsStateの閾値が+5されていること（magnitude 10）
    const fiveLegsAfterAttack = goblinAfterAttack.states.find((state) => state.id === 'trait-five-legs')
    expect(fiveLegsAfterAttack?.magnitude).toBe(10)

    const startTurnEntries = actionLog.toArray().filter((entry) => entry.type === 'start-player-turn')
    expect(startTurnEntries.length).toBeGreaterThanOrEqual(2)
    const nextTurnEntry = startTurnEntries[1]
    expect(nextTurnEntry?.postEntrySnapshot).toBeTruthy()
    const nextTurnSnapshot = nextTurnEntry?.postEntrySnapshot
    const goblinNextTurn = nextTurnSnapshot?.enemies.find((enemy) => enemy.name === 'ビーム砲')
    expect(goblinNextTurn).toBeTruthy()
    if (!nextTurnSnapshot || !goblinNextTurn) {
      return
    }

    // 次ターン開始時にスタンカウント10が再付与されていること
    const stunNextTurn = goblinNextTurn.states.find((state) => state.id === 'state-stun-count')
    expect(stunNextTurn?.magnitude).toBe(10)
  })
})
