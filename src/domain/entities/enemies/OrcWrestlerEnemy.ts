import { Enemy } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { JointLockAction } from '../actions/JointLockAction'
import { HardShellState } from '../states/HardShellState'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

export type OrcWrestlerEnemyOptions = EnemyLevelOption

export class OrcWrestlerEnemy extends Enemy {
  constructor(options?: OrcWrestlerEnemyOptions) {
    const baseProps = {
      name: '盾持ちオーク',
      maxHp: 40,
      currentHp: 40,
      actions: [new TackleAction(), new JointLockAction()],
      states: [new HardShellState(10)],
      image: '/assets/enemies/orc_sheild.png',
    }
    const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

    super(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
  }
}
