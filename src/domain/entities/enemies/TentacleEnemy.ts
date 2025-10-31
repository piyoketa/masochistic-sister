import { Enemy, type EnemyProps } from '../Enemy'
import { TentacleFlurryAction } from '../actions/TentacleFlurryAction'
import { MucusShotAction } from '../actions/MucusShotAction'

export class TentacleEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    super({
      id: 'enemy-tentacle',
      name: '触手',
      maxHp: 30,
      currentHp: 30,
      actions: [new TentacleFlurryAction(), new MucusShotAction()],
      ...overrides,
    })
  }
}
