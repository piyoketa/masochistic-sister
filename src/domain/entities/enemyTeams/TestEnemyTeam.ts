import { EnemyTeam } from '../EnemyTeam'
import { OrcEnemy, OrcDancerEnemy, TentacleEnemy, SnailEnemy } from '../enemies'
import type { EnemyProps } from '../Enemy'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { TackleAction } from '../actions/TackleAction'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { MucusShotAction } from '../actions/MucusShotAction'
import { AcidSpitAction } from '../actions/AcidSpitAction'

export interface TestEnemyTeamOptions {
  overrides?: Partial<Record<string, Partial<EnemyProps>>>
}

export class TestEnemyTeam extends EnemyTeam {
  constructor(options?: TestEnemyTeamOptions) {
    const overrides = options?.overrides ?? {}

    const orc = new OrcEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: TackleAction }),
      ...(overrides['オーク'] ?? {}),
    })

    const orcDancer = new OrcDancerEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: BattleDanceAction }),
      ...(overrides['オークダンサー'] ?? {}),
    })

    const tentacle = new TentacleEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: MucusShotAction }),
      ...(overrides['触手'] ?? {}),
    })

    const snail = new SnailEnemy({
      actionQueueFactory: () =>
        new DefaultEnemyActionQueue({ initialActionType: AcidSpitAction }),
      ...(overrides['かたつむり'] ?? {}),
    })

    super({
      id: 'enemy-team-test-encounter',
      name: 'テストかたつむり隊',
      members: [orc, orcDancer, tentacle, snail],
    })
  }
}
