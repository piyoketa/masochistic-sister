import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { GunGoblinEnemy } from '../enemies/GunGoblinEnemy'
import { GhostEnemy } from '../enemies/GhostEnemy'
import { TentacleEnemy } from '../enemies/TentacleEnemy'
import { SuccubusEnemy } from '../enemies/SuccubusEnemy'

export class GunGoblinTeam extends EnemyTeam {
  constructor() {
    const gunGoblin = new GunGoblinEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const succubus = new SuccubusEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const ghost = new GhostEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const tentacle = new TentacleEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })

    super({
      id: 'gun-goblin-team',
      name: '砲台',
      members: [gunGoblin, succubus, ghost, tentacle],
    })
  }
}
/*
責務: 銃ゴブリンチームの編成と行動キュー初期化を定義する。各メンバーの初手行動を設定し、EnemyTeamとしてバトルに供給する。
非責務: 個々の行動ロジックやターゲット選択の細かい制御は Enemy / Action 側に任せる。
主なインターフェース: EnemyTeam基底のコンストラクタへidとメンバーを渡し、BattleViewなどからteamId経由で生成される。
*/
