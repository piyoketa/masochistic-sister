import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'
import { LargeState } from '../states/LargeState'
import { FuryAwakeningState } from '../states/FuryAwakeningState'

export class OrcHeroEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 15, baseCount: 2, type: 'multi' }),
    )

    super({
      name: 'オークヒーロー',
      maxHp: 120,
      currentHp: 120,
      actions: [flurry],
      states: [new LargeState(), new FuryAwakeningState()],
      image: '/assets/enemies/orc-hero.jpg',
      ...overrides,
    })
  }
}
