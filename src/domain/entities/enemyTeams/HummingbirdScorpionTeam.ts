import { EnemyTeam } from '../EnemyTeam'
import {
  OrcLancerEnemy,
  ScorpionEnemy,
  HummingbirdEnemy,
  SlugEnemy,
} from '../enemies'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { TackleAction } from '../actions/TackleAction'

export class HummingbirdScorpionTeam extends EnemyTeam {
  constructor() {
    super({
      id: 'enemy-team-hummingbird-scorpion',
      members: [
        new OrcLancerEnemy({
          actionQueueFactory: () =>
            new DefaultEnemyActionQueue({ initialActionType: BattleDanceAction }),
        }),
        new ScorpionEnemy(),
        new HummingbirdEnemy(),
        new SlugEnemy({
          actionQueueFactory: () =>
            new DefaultEnemyActionQueue({ initialActionType: TackleAction }),
        }),
      ],
    })
  }
}
