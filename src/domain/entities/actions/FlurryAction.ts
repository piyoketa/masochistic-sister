import { Attack } from '../Action'
import { Damages } from '../Damages'

export class FlurryAction extends Attack {
  constructor() {
    super({
      name: '乱れ突き',
      baseDamage: new Damages({ baseAmount: 10, baseCount: 2, type: 'multi' }),
      cardDefinition: {
        title: '乱れ突き',
        type: 'attack',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '敵単体に10ダメージを2回与える'
  }
}
