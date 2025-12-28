import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { GunGoblinEnemy } from '../enemies/GunGoblinEnemy'
import { DrunkOrcEnemy } from '../enemies/DrunkOrcEnemy'
import { SnailEnemy } from '../enemies/SnailEnemy'
import { SuccubusEnemy } from '../enemies/SuccubusEnemy'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface GunGoblinTeamOptions {
  bonusLevels?: number
  rng?: () => number
}

export class GunGoblinTeam extends EnemyTeam {
  constructor(options?: GunGoblinTeamOptions) {
    const bonusLevels = options?.bonusLevels ?? 0
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) =>
          new GunGoblinEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new SuccubusEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new DrunkOrcEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new SnailEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
      ],
      bonusLevels,
      rng,
    )

    super({
      id: 'gun-goblin-team',
      name: '砲台',
      members,
    })
  }
}
/*
責務: 銃ゴブリンチームの編成と行動キュー初期化を定義する。各メンバーの初手行動を設定し、EnemyTeamとしてバトルに供給する。
非責務: 個々の行動ロジックやターゲット選択の細かい制御は Enemy / Action 側に任せる。
主なインターフェース: EnemyTeam基底のコンストラクタへidとメンバーを渡し、BattleViewなどからteamId経由で生成される。
*/
