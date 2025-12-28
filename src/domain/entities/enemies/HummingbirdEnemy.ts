import { Enemy } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { TailwindAction } from '../actions/TailwindAction'
import { Damages } from '../Damages'
import { FlightState } from '../states/FlightState'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type HummingbirdEnemyOptions = EnemyLevelOption

export class HummingbirdEnemy extends Enemy {
  constructor(options?: HummingbirdEnemyOptions) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 3, type: 'multi', cardId: 'flurry' }),
    )

    const baseProps = {
      name: 'ハチドリ',
      maxHp: 6,
      currentHp: 6,
      actions: [flurry, new TailwindAction()],
      states: [new FlightState()],
      image: '/assets/enemies/hummingbird.png',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 20 },
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp, 3)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
