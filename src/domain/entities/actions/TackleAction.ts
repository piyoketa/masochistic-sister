import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'

export class TackleAction extends Attack {
  constructor() {
    super({
      name: '叩かれた',
      baseDamage: new Damages({ baseAmount: 20, baseCount: 1, type: 'single' }),
      effectType: 'slam',
      cardDefinition: {
        title: '叩かれた',
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
