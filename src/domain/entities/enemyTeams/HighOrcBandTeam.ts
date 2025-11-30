import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { HighOrcLancerEnemy } from '../enemies/HighOrcLancerEnemy'
import { HighOrcDancerEnemy } from '../enemies/HighOrcDancerEnemy'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { FlurryAction } from '../actions/FlurryAction'
import { TailwindAction } from '../actions/TailwindAction'

/**
 * ハイオーク一味: ランサー2体とダンサー1体のエリート編成。
 * すべて「チームの絆」Traitを所持し、撃破されると味方の打点を底上げする。
 */
export class HighOrcBandTeam extends EnemyTeam {
  constructor() {
    const lancerA = new HighOrcLancerEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: BattleDanceAction }),
    })
    const lancerB = new HighOrcLancerEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: FlurryAction }),
    })
    const dancer = new HighOrcDancerEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: TailwindAction }),
    })

    super({
      id: 'high-orc-band',
      members: [lancerA, lancerB, dancer],
    })
  }
}
