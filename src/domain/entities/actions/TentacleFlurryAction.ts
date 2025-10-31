import { Action } from '../Action'

export class TentacleFlurryAction extends Action {
  constructor() {
    super({
      id: 'action-tentacle-flurry',
      name: '乱れ突き',
      category: 'attack',
      baseDamage: 10,
      hitCount: 3,
      description: '10ダメージ × 3',
      cardDefinition: {
        title: '乱れ突き',
        type: 'attack',
        cost: 1,
        description: '10ダメージ × 3',
      },
    })
  }
}
