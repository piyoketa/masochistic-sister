import { Enemy } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { BuildUpAction } from '../actions/BuildUpAction'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type OrcEnemyOptions = EnemyLevelOption

export class OrcEnemy extends Enemy {
  constructor(options?: OrcEnemyOptions) {
    const baseProps = {
      name: 'オーク',
      maxHp: 40,
      currentHp: 40,
      actions: [new TackleAction(), new BuildUpAction()],
      image: '/assets/enemies/orc.png',
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
