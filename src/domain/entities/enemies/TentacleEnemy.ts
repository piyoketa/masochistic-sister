import { Enemy, type EnemyProps } from '../Enemy'
import { MucusShotAction } from '../actions/MucusShotAction'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'

export class TentacleEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const tentacleFlurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )

    super({
      name: '触手',
      maxHp: 25,
      currentHp: 25,
      actions: [tentacleFlurry, new MucusShotAction()],
      image: '/assets/enemies/tentacle.png',
      ...overrides,
    })
  }
}
