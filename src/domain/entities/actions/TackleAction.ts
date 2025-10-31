import { Action } from '../Action'

export class TackleAction extends Action {
  constructor() {
    super({
      id: 'action-tackle',
      name: 'たいあたり',
      category: 'attack',
      baseDamage: 20,
      hitCount: 1,
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
