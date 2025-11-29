import { EnemyTeam } from '../EnemyTeam'
import { SlugEnemy } from '../enemies/SlugEnemy'

export class TestSlug5HpTeam extends EnemyTeam {
  constructor() {
    super({
      id: 'test-slug-5hp',
      members: [new SlugEnemy({ currentHp: 5, maxHp: 5 })],
    })
  }
}
