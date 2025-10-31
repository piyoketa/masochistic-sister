import { Attack } from '../Action'
import { Damages } from '../Damages'

export class FlurryAction extends Attack {
  constructor() {
    super({
      name: '乱れ突き',
      baseDamages: Damages.multi(10, 2),
      description: '10ダメージ × 2',
      cardDefinition: {
        title: '乱れ突き',
        type: 'attack',
        cost: 1,
        description: '10ダメージ × 2',
      },
    })
  }
}
