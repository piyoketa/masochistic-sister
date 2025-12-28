/*
TestOrcWrestlerTeam.ts の役割:
- オークレスラー編成をテスト用に固定行動キューで初期化し、シナリオ再生時に行動順がぶれないようにする。
- それぞれの敵に対し、初回行動を指定の Action で開始するキューを割り当てる。

責務ではないこと:
- 行動AIや行動ローテーションのロジック変更。本番用の OrcWrestlerTeam/各Action 側が担う。
- 戦闘ルールや手札処理の制御（Battle/OperationRunner が担う）。

主要な通信相手:
- Enemy/DefaultEnemyActionQueue: `actionQueueFactory` で初回行動を固定したキューを渡す。
- OrcTrainerEnemy/DrunkOrcEnemy/SnailEnemy/OrcWrestlerEnemy: メンバーとして生成し、各初回行動を指定する。
  - initialActionType: ShapeUpAction / DrunkenBreathAction / TackleAction / JointLockAction で揃える。
*/
import { EnemyTeam } from '../EnemyTeam'
import type { EnemyProps } from '../Enemy'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { OrcTrainerEnemy } from '../enemies/OrcTrainerEnemy'
import { DrunkOrcEnemy } from '../enemies/DrunkOrcEnemy'
import { SnailEnemy } from '../enemies/SnailEnemy'
import { OrcWrestlerEnemy } from '../enemies/OrcWrestlerEnemy'
import { ShapeUpAction } from '../actions/ShapeUpAction'
import { DrunkenBreathAction } from '../actions/DrunkenBreathAction'
import { TackleAction } from '../actions/TackleAction'
import { JointLockAction } from '../actions/JointLockAction'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface TestOrcWrestlerTeamOptions {
  overrides?: Partial<Record<string, Partial<EnemyProps>>>
  bonusLevels?: number
  rng?: () => number
}

export class TestOrcWrestlerTeam extends EnemyTeam {
  constructor(options?: TestOrcWrestlerTeamOptions) {
    const overrides = options?.overrides ?? {}
    const bonusLevels = options?.bonusLevels ?? 0
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) =>
          new OrcTrainerEnemy({
            level,
            actionQueueFactory: () =>
              new DefaultEnemyActionQueue({ initialActionType: ShapeUpAction }),
            ...(overrides['オークトレーナー'] ?? {}),
          }),
        (level) =>
          new DrunkOrcEnemy({
            level,
            actionQueueFactory: () =>
              new DefaultEnemyActionQueue({ initialActionType: DrunkenBreathAction }),
            ...(overrides['酔いどれオーク'] ?? {}),
          }),
        (level) =>
          new SnailEnemy({
            level,
            actionQueueFactory: () =>
              new DefaultEnemyActionQueue({ initialActionType: TackleAction }),
            ...(overrides['かたつむり'] ?? {}),
          }),
        (level) =>
          new OrcWrestlerEnemy({
            level,
            actionQueueFactory: () =>
              new DefaultEnemyActionQueue({ initialActionType: JointLockAction }),
            ...(overrides['オークレスラー'] ?? {}),
          }),
      ],
      bonusLevels,
      rng,
    )

    super({
      id: 'test-orc-wrestler-team',
      name: 'テスト用盾持ちオーク',
      members,
    })
  }
}
