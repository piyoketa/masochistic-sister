import { Enemy, type EnemyProps } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { BuildUpAction } from '../actions/BuildUpAction'

export class OrcEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      name: 'オーク',
      maxHp: 50,
      currentHp: 50,
      actions: [new TackleAction(), new BuildUpAction()],
      image: '/assets/enemies/orc.jpg',
      ...overrides,
    })
  }
}
