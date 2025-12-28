import { EnemyTeam } from '../EnemyTeam'
import { OrcEnemy, OrcDancerEnemy, TentacleEnemy, SnailEnemy } from '../enemies'
import type { EnemyProps } from '../Enemy'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface SnailTeamOptions {
  snailOverrides?: Partial<EnemyProps>
  bonusLevels?: number
  rng?: () => number
}

export class SnailTeam extends EnemyTeam {
  constructor(options?: SnailTeamOptions) {
    const rng = options?.rng ?? Math.random
    const bonusLevels = options?.bonusLevels ?? 0
    const members = createMembersWithLevels(
      [
        (level) => new OrcEnemy({ level }),
        (level) => new OrcDancerEnemy({ level }),
        (level) => new TentacleEnemy({ level }),
        (level) => new SnailEnemy({ level, ...options?.snailOverrides }),
      ],
      bonusLevels,
      rng,
    )

    super({
      id: 'snail-team',
      name: 'かたつむりチーム',
      members,
    })
  }
}
