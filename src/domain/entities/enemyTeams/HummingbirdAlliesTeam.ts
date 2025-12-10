import { EnemyTeam } from '../EnemyTeam'
import { OrcSumoEnemy, KamaitachiEnemy, HummingbirdEnemy, SlugEnemy } from '../enemies'
import { DefaultEnemyActionQueue } from '../enemy/actionQueues'
import { TackleAction } from '../actions/TackleAction'

export class HummingbirdAlliesTeam extends EnemyTeam {
  constructor() {
    super({
      id: 'hummingbird-allies',
      name: 'ハチドリ',
      members: [
        // new OrcLancerEnemy({
        //   maxHp: 50,
        //   currentHp: 50,
        //   actionQueueFactory: () =>
        //     new DefaultEnemyActionQueue({ initialActionType: BattleDanceAction }),
        // }),
        new OrcSumoEnemy(),
        new KamaitachiEnemy(),
        new HummingbirdEnemy(),
        new SlugEnemy(),
      ],
    })
  }
}
