import { Enemy } from '../Enemy'
import { JointLockAction } from '../actions/JointLockAction'
import { TackleAction } from '../actions/TackleAction'
import { HardShellState } from '../states/HardShellState'
import { HeavyweightState } from '../states/HeavyweightState'
import { buildDefaultLevelConfigs, buildEnemyPropsWithLevel, type EnemyLevelOption } from './levelUtils'

/*
重装オーク:
- HP 60
- Trait: 堅固(20)
- 技: 叩き潰す / 殴打(20)
*/
export function createHeavyOrc(options?: EnemyLevelOption): Enemy {
  const baseProps = {
    name: '重装オーク',
    maxHp: 60,
    currentHp: 60,
    actions: [new JointLockAction(), new TackleAction()],
    // 堅固(20)で被ダメ軽減しつつ、重量化で与ダメ増・回数減の重戦士
    states: [new HardShellState(20), new HeavyweightState()],
    image: '/assets/enemies/orc.jpg',
  }
  const levelConfigs = buildDefaultLevelConfigs(baseProps.maxHp)

  return new Enemy(buildEnemyPropsWithLevel(baseProps, levelConfigs, options))
}
