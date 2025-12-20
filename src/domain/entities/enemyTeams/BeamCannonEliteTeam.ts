import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { GoblinBeamCannonEnemy } from '../enemies/GoblinBeamCannonEnemy'
import { DrunkOrcEnemy } from '../enemies/DrunkOrcEnemy'
import { GhostEnemy } from '../enemies/GhostEnemy'
import { OrcTrainerEnemy } from '../enemies/OrcTrainerEnemy'
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
        new DefaultEnemyActionQueue(),
    })
    const drunkOrc = new DrunkOrcEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue(),
    })
    const trainer = new OrcTrainerEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue(),
    })
    const tentacle = new TentacleEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue(),
    })

    super({
      id: 'beam-cannon-elite',
      name: 'ビーム砲',
      members: [cannon, drunkOrc, trainer, tentacle],
    })
  }
}
