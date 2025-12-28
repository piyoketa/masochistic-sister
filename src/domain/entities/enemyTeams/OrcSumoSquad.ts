import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { OrcSumoEnemy } from '../enemies/OrcSumoEnemy'
import { GhostEnemy } from '../enemies/GhostEnemy'
import { KamaitachiEnemy } from '../enemies/KamaitachiEnemy'
import { TentacleEnemy } from '../enemies/TentacleEnemy'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface OrcSumoSquadOptions {
  bonusLevels?: number
  rng?: () => number
}

/**
 * オーク力士＋霊/風/触手の混成チーム。
 */
export class OrcSumoSquad extends EnemyTeam {
  constructor(options?: OrcSumoSquadOptions) {
    const bonusLevels = options?.bonusLevels ?? 0
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) =>
          new OrcSumoEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new GhostEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new KamaitachiEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new TentacleEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
      ],
      bonusLevels,
      rng,
    )

    super({
      id: 'orc-sumo-squad',
      name: 'オーク力士部隊',
      members,
    })
  }
}
