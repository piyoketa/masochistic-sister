import { Enemy, type EnemyProps } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { AcidSpitAction } from '../actions/AcidSpitAction'
import { HardShellState } from '../states/HardShellState'

export class SnailEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      id: 'enemy-snail',
      name: 'かたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [new TackleAction(), new AcidSpitAction()],
      traits: [new HardShellState()],
      startingActionIndex: 1, // TODO 敵の初期行動は、初期化時にランダムに決定する
      ...overrides,
    })
  }
}
