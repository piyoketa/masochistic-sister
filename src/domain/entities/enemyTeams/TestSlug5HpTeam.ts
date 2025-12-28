import { EnemyTeam } from '../EnemyTeam'
import { SlugEnemy } from '../enemies/SlugEnemy'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface TestSlug5HpTeamOptions {
  bonusLevels?: number
  rng?: () => number
}

export class TestSlug5HpTeam extends EnemyTeam {
  constructor(options?: TestSlug5HpTeamOptions) {
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) => new SlugEnemy({ level, currentHp: 5, maxHp: 5 }),
      ],
      0,
      rng,
    )
    super({
      id: 'test-slug-5hp',
      name: 'テストなめくじ5HP',
      members,
    })
  }
}
