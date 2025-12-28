import { EnemyTeam } from '../EnemyTeam'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { HighOrcLancerEnemy } from '../enemies/HighOrcLancerEnemy'
import { HighOrcDancerEnemy } from '../enemies/HighOrcDancerEnemy'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { FlurryAction } from '../actions/FlurryAction'
import { TailwindAction } from '../actions/TailwindAction'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface HighOrcBandTeamOptions {
  bonusLevels?: number
  rng?: () => number
}

/**
 * ハイオーク一味: ランサー2体とダンサー1体のエリート編成。
 * すべて「チームの絆」Traitを所持し、撃破されると味方の打点を底上げする。
 */
export class HighOrcBandTeam extends EnemyTeam {
  constructor(options?: HighOrcBandTeamOptions) {
    const bonusLevels = options?.bonusLevels ?? 0
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) =>
          new HighOrcLancerEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new HighOrcLancerEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new HighOrcDancerEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
        (level) =>
          new HighOrcDancerEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue(),
          }),
      ],
      bonusLevels,
      rng,
    )

    super({
      id: 'high-orc-band',
      name: 'ハイオーク一味',
      members,
    })
  }
}
