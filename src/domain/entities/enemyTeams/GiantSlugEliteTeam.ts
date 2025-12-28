import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { GiantSlugKingEnemy } from '../enemies/GiantSlugKingEnemy'
import { SlugEnemy } from '../enemies/SlugEnemy'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface GiantSlugEliteTeamOptions {
  bonusLevels?: number
  rng?: () => number
}

export class GiantSlugEliteTeam extends EnemyTeam {
  constructor(options?: GiantSlugEliteTeamOptions) {
    const bonusLevels = options?.bonusLevels ?? 0
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) => new GiantSlugKingEnemy({ level }),
        (level) =>
          new SlugEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new SlugEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
      ],
      bonusLevels,
      rng,
    )
    super({
      id: 'giant-slug-elite',
      name: '大王なめくじ隊',
      members,
    })
  }
}
