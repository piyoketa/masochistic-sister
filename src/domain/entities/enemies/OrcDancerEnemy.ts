import { Enemy } from '../Enemy'
import { FlurryAction } from '../actions/FlurryAction'
import { BattleDanceAction } from '../actions/BattleDanceAction'
import { Damages } from '../Damages'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type OrcDancerEnemyOptions = EnemyLevelOption

export class OrcDancerEnemy extends Enemy {
  constructor(options?: OrcDancerEnemyOptions) {
    const OrcFlurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )

    const baseProps = {
      name: 'オークダンサー',
      maxHp: 40,
      currentHp: 40,
      actions: [OrcFlurry, new BattleDanceAction()],
      image: '/assets/enemies/orc_lancer.png',
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
