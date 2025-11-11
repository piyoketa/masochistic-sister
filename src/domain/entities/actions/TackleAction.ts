import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'

export class TackleAction extends Attack {
  constructor() {
    super({
      name: 'たいあたり',
      baseDamage: new Damages({ baseAmount: 20, baseCount: 1, type: 'single' }),
      cardDefinition: {
        title: 'たいあたり',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return 'ふつうの一回攻撃'
  }
}
