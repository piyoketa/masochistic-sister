import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { GiantSlugKingEnemy } from '../enemies/GiantSlugKingEnemy'
import { SlugEnemy } from '../enemies/SlugEnemy'

export class GiantSlugEliteTeam extends EnemyTeam {
  constructor() {
    const king = new GiantSlugKingEnemy()
    const slugA = new SlugEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const slugB = new SlugEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    super({
      id: 'giant-slug-elite',
      name: '大王なめくじ隊',
      members: [king, slugA, slugB],
    })
  }
}
