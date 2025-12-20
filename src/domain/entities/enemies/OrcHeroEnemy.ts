import { Enemy, type EnemyProps } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'
import { LargeState } from '../states/LargeState'
import { FuryAwakeningState } from '../states/FuryAwakeningState'
import { BuildUpAction } from '../actions/BuildUpAction'

export class OrcHeroEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )

    super({
      name: 'オークヒーロー',
      maxHp: 150,
      currentHp: 150,
      actions: [flurry, new BuildUpAction()],
      states: [new LargeState(), new FuryAwakeningState()],
      image: '/assets/enemies/orc-hero.png',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 100 },
      ...overrides,
    })
  }
}
