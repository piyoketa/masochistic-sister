import { Enemy } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { Damages } from '../Damages'
import { ScareAction } from '../actions/ScareAction'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type GhostEnemyOptions = EnemyLevelOption

export class GhostEnemy extends Enemy {
  constructor(options?: GhostEnemyOptions) {
    const lightTackle = new TackleAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 1, type: 'single', cardId: 'tackle' }),
    )
    const baseProps = {
      name: 'ゴースト',
      maxHp: 30,
      currentHp: 30,
      actions: [lightTackle, new ScareAction()],
      image: '/assets/enemies/kamaitachi.jpg',
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
