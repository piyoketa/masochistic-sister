import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'
import { WeakState } from '../states/WeakState'

export class ScareAction extends Attack {
  constructor() {
    super({
      name: 'おどかす',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single' }),
      effectType: 'fear',
      inflictStates: [() => new WeakState(1)],
      cardDefinition: {
        title: 'おどかす',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return ''
  }
}
