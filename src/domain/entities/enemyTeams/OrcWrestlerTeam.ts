import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { SnailEnemy } from '../enemies/SnailEnemy'
import { OrcWrestlerEnemy } from '../enemies/OrcWrestlerEnemy'
import { OrcTrainerEnemy } from '../enemies/OrcTrainerEnemy'
import { DrunkOrcEnemy } from '../enemies/DrunkOrcEnemy'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface OrcWrestlerTeamOptions {
  bonusLevels?: number
  rng?: () => number
}

export class OrcWrestlerTeam extends EnemyTeam {
  constructor(options?: OrcWrestlerTeamOptions) {
    const bonusLevels = options?.bonusLevels ?? 0
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) =>
          new OrcTrainerEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new DrunkOrcEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new SnailEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new OrcWrestlerEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
      ],
      bonusLevels,
      rng,
    )
    super({
      id: 'orc-wrestler-team',
      name: '盾持ちオーク',
      members,
    })
  }
}
