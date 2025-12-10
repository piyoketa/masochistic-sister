import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { SnailEnemy } from '../enemies/SnailEnemy'
import { OrcWrestlerEnemy } from '../enemies/OrcWrestlerEnemy'
import { OrcTrainerEnemy } from '../enemies/OrcTrainerEnemy'
import { DrunkOrcEnemy } from '../enemies/DrunkOrcEnemy'

export class OrcWrestlerTeam extends EnemyTeam {
  constructor() {
    const trainer = new OrcTrainerEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const drunk = new DrunkOrcEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const snail = new SnailEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const wrestler = new OrcWrestlerEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    super({
      id: 'orc-wrestler-team',
      name: '盾持ちオーク',
      members: [trainer, drunk, snail, wrestler],
    })
  }
}
