import { EnemyTeam } from '../EnemyTeam'
import { OrcSumoEnemy, KamaitachiEnemy, HummingbirdEnemy, SlugEnemy } from '../enemies'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { TackleAction } from '../actions/TackleAction'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface HummingbirdAlliesTeamOptions {
  bonusLevels?: number
  rng?: () => number
}

export class HummingbirdAlliesTeam extends EnemyTeam {
  constructor(options?: HummingbirdAlliesTeamOptions) {
    const bonusLevels = options?.bonusLevels ?? 0
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) => new OrcSumoEnemy({ level }),
        (level) => new KamaitachiEnemy({ level }),
        (level) => new HummingbirdEnemy({ level }),
        (level) =>
          new SlugEnemy({
            level,
            actionQueueFactory: () =>
              new DefaultEnemyActionQueue({ initialActionType: TackleAction }),
          }),
      ],
      bonusLevels,
      rng,
    )
    super({
      id: 'hummingbird-allies',
      name: 'ハチドリ',
      members,
    })
  }
}
