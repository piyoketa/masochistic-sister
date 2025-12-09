import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { TailwindAction } from '../actions/TailwindAction'
import { Damages } from '../Damages'
import { FlightState } from '../states/FlightState'

export class HummingbirdEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 3, type: 'multi', cardId: 'flurry' }),
    )

    super({
      name: 'ハチドリ',
      maxHp: 10,
      currentHp: 10,
      actions: [flurry, new TailwindAction()],
      states: [new FlightState(1)],
      image: '/assets/enemies/hummingbird.jpg',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 50 },
      ...overrides,
    })
  }
}
