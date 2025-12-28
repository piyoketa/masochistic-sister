import { EnemyTeam } from '../EnemyTeam'
import { OrcEnemy, OrcDancerEnemy, TentacleEnemy, SnailEnemy } from '../enemies'
import type { EnemyProps } from '../Enemy'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { TackleAction } from '../actions/TackleAction'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { MucusShotAction } from '../actions/MucusShotAction'
import { AcidSpitAction } from '../actions/AcidSpitAction'
import { createMembersWithLevels } from './bonusLevelUtils'

export interface TestEnemyTeamOptions {
  overrides?: Partial<Record<string, Partial<EnemyProps>>>
  bonusLevels?: number
  rng?: () => number
}

export class TestEnemyTeam extends EnemyTeam {
  constructor(options?: TestEnemyTeamOptions) {
    const overrides = options?.overrides ?? {}
    const bonusLevels = options?.bonusLevels ?? 0
    const rng = options?.rng ?? Math.random
    const members = createMembersWithLevels(
      [
        (level) =>
          new OrcEnemy({
            level,
            actionQueueFactory: () =>
              new DefaultEnemyActionQueue({ initialActionType: TackleAction }),
            ...(overrides['オーク'] ?? {}),
          }),
        (level) =>
          new OrcDancerEnemy({
            level,
            actionQueueFactory: () =>
              new DefaultEnemyActionQueue({ initialActionType: BattleDanceAction }),
            ...(overrides['オークダンサー'] ?? {}),
          }),
        (level) =>
          new TentacleEnemy({
            level,
            actionQueueFactory: () =>
              new DefaultEnemyActionQueue({ initialActionType: MucusShotAction }),
            ...(overrides['触手'] ?? {}),
          }),
        (level) =>
          new SnailEnemy({
            level,
            actionQueueFactory: () =>
              new DefaultEnemyActionQueue({ initialActionType: AcidSpitAction }),
            ...(overrides['かたつむり'] ?? {}),
          }),
      ],
      bonusLevels,
      rng,
    )

    super({
      id: 'enemy-team-test-encounter',
      name: 'かたつむり',
      members,
    })
  }
}
