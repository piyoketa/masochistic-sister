import { Enemy } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'
import { PoisonStingAction } from '../actions/PoisonStingAction'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type ScorpionEnemyOptions = EnemyLevelOption

export class ScorpionEnemy extends Enemy {
  constructor(options?: ScorpionEnemyOptions) {
    const flurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 5, baseCount: 4, type: 'multi', cardId: 'flurry' }),
    )

    const baseProps = {
      name: 'サソリ',
      maxHp: 30,
      currentHp: 30,
      actions: [new PoisonStingAction(), flurry],
      image: '/assets/enemies/scorpion.jpg',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 30 },      
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
