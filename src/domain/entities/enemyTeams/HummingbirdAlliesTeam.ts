import { EnemyTeam } from '../EnemyTeam'
import { OrcLancerEnemy, KamaitachiEnemy, HummingbirdEnemy, SlugEnemy } from '../enemies'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { TackleAction } from '../actions/TackleAction'

export class HummingbirdAlliesTeam extends EnemyTeam {
  constructor() {
    super({
      id: 'hummingbird-allies',
      name: 'ハチドリ隊',
      members: [
        new OrcLancerEnemy({
          maxHp: 50,
          currentHp: 50,
          actionQueueFactory: () =>
            new DefaultEnemyActionQueue({ initialActionType: BattleDanceAction }),
        }),
        new KamaitachiEnemy(),
        new HummingbirdEnemy(),
        new SlugEnemy({
          actionQueueFactory: () =>
            new DefaultEnemyActionQueue({ initialActionType: TackleAction }),
        }),
      ],
    })
  }
}
