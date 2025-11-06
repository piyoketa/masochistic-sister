import { EnemyTeam } from '../EnemyTeam'
import {
  OrcLancerEnemy,
  ScorpionEnemy,
  HummingbirdEnemy,
  SlugEnemy,
} from '../enemies'

export class HummingbirdScorpionTeam extends EnemyTeam {
  constructor() {
    super({
      id: 'enemy-team-hummingbird-scorpion',
      members: [
        new OrcLancerEnemy(),
        new ScorpionEnemy(),
        new HummingbirdEnemy(),
        new SlugEnemy(),
      ],
    })
  }
}
