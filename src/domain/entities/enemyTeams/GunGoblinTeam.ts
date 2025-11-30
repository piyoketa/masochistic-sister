import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { GunGoblinEnemy } from '../enemies/GunGoblinEnemy'
import { EyeballGhostEnemy } from '../enemies/EyeballGhostEnemy'
import { SnailEnemy } from '../enemies/SnailEnemy'
import { OrcWrestlerEnemy } from '../enemies/OrcWrestlerEnemy'
import { PowerChargeAction } from '../actions/PowerChargeAction'
import { ConfusingGazeAction } from '../actions/ConfusingGazeAction'
import { JointLockAction } from '../actions/JointLockAction'
import { TackleAction } from '../actions/TackleAction'

export class GunGoblinTeam extends EnemyTeam {
  constructor() {
    const gunGoblin = new GunGoblinEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue(),
    })
    const eyeball = new EyeballGhostEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue(),
    })
    const snail = new SnailEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue(),
    })
    const wrestler = new OrcWrestlerEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue(),
    })

    super({
      id: 'gun-goblin-team',
      name: '銃ゴブリン隊',
      members: [gunGoblin, eyeball, snail, wrestler],
    })
  }
}
/*
責務: 銃ゴブリンチームの編成と行動キュー初期化を定義する。各メンバーの初手行動を設定し、EnemyTeamとしてバトルに供給する。
非責務: 個々の行動ロジックやターゲット選択の細かい制御は Enemy / Action 側に任せる。
主なインターフェース: EnemyTeam基底のコンストラクタへidとメンバーを渡し、BattleViewなどからteamId経由で生成される。
*/
