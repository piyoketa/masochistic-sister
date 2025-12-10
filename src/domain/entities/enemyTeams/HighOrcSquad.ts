import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { HighOrcEnemy } from '../enemies/HighOrcEnemy'
import { SuccubusEnemy } from '../enemies/SuccubusEnemy'
import { KamaitachiEnemy } from '../enemies/KamaitachiEnemy'
import { SnailEnemy } from '../enemies/SnailEnemy'

export class HighOrcSquad extends EnemyTeam {
  constructor() {
    const highOrc = new HighOrcEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const succubus = new SuccubusEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const kamaitachi = new KamaitachiEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const snail = new SnailEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })

    super({
      id: 'high-orc-squad',
      name: 'ハイオーク部隊',
      members: [highOrc, succubus, kamaitachi, snail],
    })
  }
}
