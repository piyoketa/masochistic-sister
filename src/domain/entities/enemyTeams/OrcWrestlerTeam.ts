import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { BatEnemy } from '../enemies/BatEnemy'
import { GhostEnemy } from '../enemies/GhostEnemy'
import { SnailEnemy } from '../enemies/SnailEnemy'
import { OrcWrestlerEnemy } from '../enemies/OrcWrestlerEnemy'

export class OrcWrestlerTeam extends EnemyTeam {
  constructor() {
    const bat = new BatEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue(),
    })
    const ghost = new GhostEnemy({
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
      id: 'orc-wrestler-team',
      name: 'オークレスラー混成隊',
      members: [bat, ghost, snail, wrestler],
    })
  }
}
