import { Enemy, type EnemyProps } from '../Enemy'
import { MucusShotAction } from '../actions/MucusShotAction'
import { FlurryAction } from '../actions/FlurryAction'
import { Damages } from '../Damages'

export class TentacleEnemy extends Enemy {
  constructor(overrides?: Partial<EnemyProps>) {
    const tentacleFlurry = new FlurryAction().cloneWithDamages(
      new Damages({ baseAmount: 10, baseCount: 3, type: 'multi' }),
      {
        cardDefinition: {
          description: '敵単体に10ダメージを3回与える',
        },
      },
    )

    super({
      name: '触手',
      maxHp: 30,
      currentHp: 30,
      actions: [tentacleFlurry, new MucusShotAction()],
      ...overrides,
    })
  }
}
