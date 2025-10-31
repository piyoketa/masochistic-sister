import { ContinuousAttack } from '../Action'

export class FlurryAction extends ContinuousAttack {
  constructor() {
    super({
      name: '乱れ突き',
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
