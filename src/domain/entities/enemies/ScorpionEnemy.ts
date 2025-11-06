import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'
import { PoisonStingAction } from '../actions/PoisonStingAction'

export class ScorpionEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 5, baseCount: 4, type: 'multi' }),
    )

    super({
      name: 'サソリ',
      maxHp: 30,
      currentHp: 30,
      actions: [new PoisonStingAction(), flurry],
      image: '/assets/enemies/scorpion.jpg',
      ...overrides,
    })
  }
}
