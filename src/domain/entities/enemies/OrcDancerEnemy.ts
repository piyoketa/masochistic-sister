import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { BattleDanceAction } from '../actions/BattleDanceAction'

export class OrcDancerEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      name: 'オークダンサー（短剣）',
      maxHp: 50,
      currentHp: 50,
      actions: [new FlurryAction(), new BattleDanceAction()],
      ...overrides,
    })
  }
}
