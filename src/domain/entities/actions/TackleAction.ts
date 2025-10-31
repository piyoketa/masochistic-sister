import { Attack } from '../Action'
import { Damages } from '../Damages'

export class TackleAction extends Attack {
  constructor() {
    super({
      name: 'たいあたり',
      baseDamages: Damages.single(20),
      description: '20ダメージ',
      cardDefinition: {
        title: 'たいあたり',
        type: 'attack',
        cost: 1,
        description: '20ダメージ',
      },
    })
  }
}
