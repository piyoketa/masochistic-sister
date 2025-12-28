import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { HighOrcEnemy } from '../enemies/HighOrcEnemy'
import { SuccubusEnemy } from '../enemies/SuccubusEnemy'
import { KamaitachiEnemy } from '../enemies/KamaitachiEnemy'
import { SnailEnemy } from '../enemies/SnailEnemy'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface HighOrcSquadOptions {
  bonusLevels?: number
  rng?: () => number
}

export class HighOrcSquad extends EnemyTeam {
  constructor(options?: HighOrcSquadOptions) {
    const bonusLevels = options?.bonusLevels ?? 0
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) =>
          new HighOrcEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new SuccubusEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new KamaitachiEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new SnailEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
      ],
      bonusLevels,
      rng,
    )

    super({
      id: 'high-orc-squad',
      name: 'ハイオーク',
      members,
    })
  }
}
