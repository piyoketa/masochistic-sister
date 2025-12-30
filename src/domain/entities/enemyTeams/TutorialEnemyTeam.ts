import { EnemyTeam } from '../EnemyTeam'
import { OrcLancerEnemy } from '../enemies/OrcLancerEnemy'
import { SlugEnemy } from '../enemies/SlugEnemy'
import { SnailEnemy } from '../enemies/SnailEnemy'
import { FlurryAction } from '../actions/FlurryAction'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { TackleAction } from '../actions/TackleAction'
import { AcidSpitAction } from '../actions/AcidSpitAction'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface TutorialEnemyTeamOptions {
  bonusLevels?: number
  rng?: () => number
}

/**
 * チュートリアル用の固定敵チーム。
 * - オークランサー: 初手フルーリー(10×2)を確定し、以降はデフォルト行動ローテーション。
 * - なめくじ: HP30 / 初手殴打(20)。
 * - かたつむり: 初手「溶かす」(AcidSpit)。
 */
export class TutorialEnemyTeam extends EnemyTeam {
  constructor(options?: TutorialEnemyTeamOptions) {
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) =>
          new OrcLancerEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue({ initialActionType: FlurryAction }),
          }),
        (level) =>
          new SlugEnemy({
            level,
            maxHp: 30,
            currentHp: 30,
            actionQueueFactory: () => new DefaultEnemyActionQueue({ initialActionType: TackleAction }),
          }),
        (level) =>
          new SnailEnemy({
            level,
            actionQueueFactory: () => new DefaultEnemyActionQueue({ initialActionType: AcidSpitAction }),
          }),
      ],
      0,
      rng,
    )

    super({
      id: 'enemy-team-tutorial',
      name: 'チュートリアル',
      members,
    })
  }
}
