import { Enemy, type EnemyProps } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { AcidSpitAction } from '../actions/AcidSpitAction'
import { HardShellState } from '../states/HardShellState'
import { StatusImmunityTrait } from '../states/StatusImmunityTrait'

export class SnailEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      name: 'かたつむり',
      maxHp: 10,
      currentHp: 10,
      actions: [new TackleAction(), new AcidSpitAction()],
      states: [new HardShellState(), new StatusImmunityTrait()],
      image: '/assets/enemies/snail.png',
      ...overrides,
    })
  }
}
