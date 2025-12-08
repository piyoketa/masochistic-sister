import { Enemy, type EnemyProps } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { JointLockAction } from '../actions/JointLockAction'
import { HardShellState } from '../states/HardShellState'

export class OrcWrestlerEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      name: 'オークレスラー',
      maxHp: 40,
      currentHp: 40,
      actions: [new TackleAction(), new JointLockAction()],
      states: [new HardShellState(10)],
      image: '/assets/enemies/orc.jpg',
      ...overrides,
    })
  }
}
