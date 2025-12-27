import { EnemyTeam } from '../EnemyTeam'
import { OrcEnemy, OrcDancerEnemy, TentacleEnemy, SnailEnemy } from '../enemies'
import type { EnemyProps } from '../Enemy'

export interface SnailTeamOptions {
  snailOverrides?: Partial<EnemyProps>
}

export class SnailTeam extends EnemyTeam {
  constructor(options?: SnailTeamOptions) {
    const orc = new OrcEnemy()
    const orcDancer = new OrcDancerEnemy()
    const tentacle = new TentacleEnemy()
    const snail = new SnailEnemy(options?.snailOverrides)

    super({
      id: 'snail-team',
      name: 'かたつむりチーム',
      members: [orc, orcDancer, tentacle, snail],
    })
  }
}
