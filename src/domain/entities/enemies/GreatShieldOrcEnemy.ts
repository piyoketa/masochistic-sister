import { Enemy } from '../Enemy'
import { JointLockAction } from '../actions/JointLockAction'
import { TackleAction } from '../actions/TackleAction'
import { HardShellState } from '../states/HardShellState'

/*
大盾オーク:
- HP 40
- Trait: 堅固(30)
- 技: 叩き潰す / 殴打(20)
*/
export function createGreatShieldOrc(): Enemy {
  return new Enemy({
    name: '大盾オーク',
    maxHp: 40,
    currentHp: 40,
    actions: [new JointLockAction(), new TackleAction()],
    states: [new HardShellState(30)],
    image: '/assets/enemies/orc.jpg',
  })
}
