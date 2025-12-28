import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { GoblinBeamCannonEnemy } from '../enemies/GoblinBeamCannonEnemy'
import { DrunkOrcEnemy } from '../enemies/DrunkOrcEnemy'
import { GhostEnemy } from '../enemies/GhostEnemy'
import { OrcTrainerEnemy } from '../enemies/OrcTrainerEnemy'
import { TentacleEnemy } from '../enemies/TentacleEnemy'
import { BeamShotAction } from '../actions/BeamShotAction'
import { PowerChargeAction } from '../actions/PowerChargeAction'
import { DrunkenBreathAction } from '../actions/DrunkenBreathAction'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface BeamCannonEliteTeamOptions {
  // ボスはレベル固定: bonusLevels は無視する。
  bonusLevels?: number
  rng?: () => number
}

/**
 * エリート: ビーム砲チーム
 */
export class BeamCannonEliteTeam extends EnemyTeam {
  constructor(options?: BeamCannonEliteTeamOptions) {
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) =>
          new GoblinBeamCannonEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new DrunkOrcEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new OrcTrainerEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new TentacleEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
      ],
      0,
      rng,
    )

    super({
      id: 'beam-cannon-elite',
      name: 'ビーム砲',
      members,
    })
  }
}
