import { Enemy, type EnemyProps } from '../Enemy'
import { TackleAction } from '../actions/TackleAction'
import { Damages } from '../Damages'
import { ScareAction } from '../actions/ScareAction'

export class GhostEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const lightTackle = new TackleAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 1, type: 'single', cardId: 'tackle' }),
    )
    super({
      name: 'ゴースト',
      maxHp: 30,
      currentHp: 30,
      actions: [lightTackle, new ScareAction()],
      image: '/assets/enemies/kamaitachi.jpg',
      ...overrides,
    })
  }
}
