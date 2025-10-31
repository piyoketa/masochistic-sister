import { Action } from '../Action'

export class FlurryAction extends Action {
  constructor() {
    super({
      id: 'action-flurry',
      name: '乱れ突き',
      category: 'attack',
      baseDamage: 10,
      hitCount: 2,
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
