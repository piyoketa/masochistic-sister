import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { OrcSumoEnemy } from '../enemies/OrcSumoEnemy'
import { GhostEnemy } from '../enemies/GhostEnemy'
import { KamaitachiEnemy } from '../enemies/KamaitachiEnemy'
import { TentacleEnemy } from '../enemies/TentacleEnemy'

/**
 * オーク力士＋霊/風/触手の混成チーム。
 */
export class OrcSumoSquad extends EnemyTeam {
  constructor() {
    const orcSumo = new OrcSumoEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const ghost = new GhostEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const kamaitachi = new KamaitachiEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })
    const tentacle = new TentacleEnemy({
      actionQueueFactory: () => new DefaultEnemyActionQueue(),
    })

    super({
      id: 'orc-sumo-squad',
      name: 'オーク力士部隊',
      members: [orcSumo, ghost, kamaitachi, tentacle],
    })
  }
}
