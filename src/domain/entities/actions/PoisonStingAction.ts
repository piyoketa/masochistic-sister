import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'
import { PoisonState } from '../states/PoisonState'

export class PoisonStingAction extends Attack {
  static readonly cardId = 'poison-sting'
  constructor() {
    super({
      name: '毒針',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single', cardId: 'poison-sting' }),
      effectType: 'poison',
      inflictStates: [() => new PoisonState(5)],
      cardDefinition: {
        title: '毒針',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '5ダメージを与え、毒(5)を付与する'
  }
}
