import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag, StrikeCardTag } from '../cardTags'

export class TackleAction extends Attack {
  static readonly cardId = 'tackle'
  constructor() {
    super({
      name: '殴打',
      baseDamage: new Damages({ baseAmount: 20, baseCount: 1, type: 'single', cardId: 'tackle' }),
      effectType: 'slam',
      cardDefinition: {
        title: '殴打',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
        categoryTags: [new StrikeCardTag()],
      },
    })
  }
}
