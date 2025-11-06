import { Enemy, type EnemyProps } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { AcidSpitAction } from '../actions/AcidSpitAction'
import { HardShellState } from '../states/HardShellState'

export class SnailEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      name: 'かたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [new TackleAction(), new AcidSpitAction()],
      states: [new HardShellState()],
      image: '/assets/enemies/snail.jpg',
      ...overrides,
    })
  }
}
