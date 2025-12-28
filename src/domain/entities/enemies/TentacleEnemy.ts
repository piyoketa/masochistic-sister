import { Enemy } from '../Enemy'
import { MucusShotAction } from '../actions/MucusShotAction'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type TentacleEnemyOptions = EnemyLevelOption

export class TentacleEnemy extends Enemy {
  constructor(options?: TentacleEnemyOptions) {
    const tentacleFlurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 2, type: 'multi', cardId: 'flurry' }),
    )

    const baseProps = {
      name: '触手',
      maxHp: 25,
      currentHp: 25,
      actions: [tentacleFlurry, new MucusShotAction()],
      image: '/assets/enemies/tentacle.png',
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp, 5)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
