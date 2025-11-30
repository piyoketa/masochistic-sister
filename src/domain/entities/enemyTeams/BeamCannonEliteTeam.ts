import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { GoblinBeamCannonEnemy } from '../enemies/GoblinBeamCannonEnemy'
import { DrunkOrcEnemy } from '../enemies/DrunkOrcEnemy'
import { GhostEnemy } from '../enemies/GhostEnemy'
import { TentacleEnemy } from '../enemies/TentacleEnemy'
import { BeamShotAction } from '../actions/BeamShotAction'
import { PowerChargeAction } from '../actions/PowerChargeAction'
import { DrunkenBreathAction } from '../actions/DrunkenBreathAction'

/**
 * エリート: ビーム砲チーム
 */
export class BeamCannonEliteTeam extends EnemyTeam {
  constructor() {
    const cannon = new GoblinBeamCannonEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: PowerChargeAction }),
    })
    const drunkOrc = new DrunkOrcEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: DrunkenBreathAction }),
    })
    const ghost = new GhostEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: BeamShotAction }),
    })
    const tentacle = new TentacleEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: BeamShotAction }),
    })

    super({
      id: 'beam-cannon-elite',
      members: [cannon, drunkOrc, ghost, tentacle],
    })
  }
}
