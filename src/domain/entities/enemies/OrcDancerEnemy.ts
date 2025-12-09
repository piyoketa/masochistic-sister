import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { Damages } from '../Damages'

export class OrcDancerEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const OrcFlurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )

    super({
      name: 'オークダンサー',
      maxHp: 40,
      currentHp: 40,
      actions: [OrcFlurry, new BattleDanceAction()],
      image: '/assets/enemies/orc-dancer.jpg',
      ...overrides,
    })
  }
}
