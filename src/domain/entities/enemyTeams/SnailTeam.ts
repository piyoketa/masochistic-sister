import { EnemyTeam } from '../EnemyTeam'
import { OrcEnemy, OrcDancerEnemy, TentacleEnemy, SnailEnemy } from '../enemies'

export class SnailTeam extends EnemyTeam {
  constructor() {
    const orc = new OrcEnemy()
    const orcDancer = new OrcDancerEnemy()
    const tentacle = new TentacleEnemy()
    const snail = new SnailEnemy()

    super({
      id: 'enemy-team-snail-encounter',
      members: [orc, orcDancer, tentacle, snail],
    })
  }
}
