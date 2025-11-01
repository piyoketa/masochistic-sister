import { Attack } from '../Action'
import { Damages } from '../Damages'

export class TackleAction extends Attack {
  constructor() {
    super({
      name: 'たいあたり',
      baseDamage: Damages.single(20),
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
