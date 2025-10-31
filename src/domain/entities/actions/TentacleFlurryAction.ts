import { ContinuousAttack } from '../Action'

export class TentacleFlurryAction extends ContinuousAttack {
  constructor() {
    super({
      name: '乱れ突き',
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
