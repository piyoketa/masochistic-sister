import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { BatEnemy } from '../enemies/BatEnemy'
import { GhostEnemy } from '../enemies/GhostEnemy'
import { SnailEnemy } from '../enemies/SnailEnemy'
import { OrcWrestlerEnemy } from '../enemies/OrcWrestlerEnemy'
import { TackleAction } from '../actions/TackleAction'
import { ScareAction } from '../actions/ScareAction'
import { JointLockAction } from '../actions/JointLockAction'

export class OrcWrestlerTeam extends EnemyTeam {
  constructor() {
    const bat = new BatEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: TackleAction }),
    })
    const ghost = new GhostEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: ScareAction }),
    })
    const snail = new SnailEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: TackleAction }),
    })
    const wrestler = new OrcWrestlerEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: JointLockAction }),
    })
    super({
      id: 'orc-wrestler-team',
      members: [bat, ghost, snail, wrestler],
    })
  }
}
