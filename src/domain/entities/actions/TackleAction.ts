import { Attack } from '../Action'
import { Damages } from '../Damages'

export class TackleAction extends Attack {
  constructor() {
    super({
      name: 'たいあたり',
      baseDamage: new Damages({ baseAmount: 20, baseCount: 1, type: 'single' }),
      cardDefinition: {
        title: 'たいあたり',
        type: 'attack',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '敵単体に20ダメージを与える'
  }
}
