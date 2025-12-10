import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { FattenAction } from '../actions/FattenAction'
import { Damages } from '../Damages'
import { HeavyweightState } from '../states/HeavyweightState'

/**
 * オーク力士: 突き刺すと重量化付与攻撃を行うタフな近接型。
 */
export class OrcSumoEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({
        baseAmount: 20,
        baseCount: 2,
        type: 'multi',
        cardId: 'flurry',
      }),
    )
    super({
      name: 'オーク力士',
      maxHp: 40,
      currentHp: 40,
      actions: [flurry, new FattenAction()],
      states: [new HeavyweightState()],
      allyBuffWeights: { tailwind: 100 },
      image: '/assets/enemies/orc.jpg',
      ...overrides,
    })
  }
}
