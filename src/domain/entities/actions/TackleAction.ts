import { SingleAttack } from '../Action'

export class TackleAction extends SingleAttack {
  constructor() {
    super({
      id: 'action-tackle',
      name: 'たいあたり',
      baseDamage: 20,
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
