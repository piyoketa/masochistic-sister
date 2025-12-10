import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'
import { JointDamageState } from '../states/JointDamageState'

export class JointLockAction extends Attack {
  constructor() {
    super({
      name: '叩き潰す',
      baseDamage: new Damages({ baseAmount: 10, baseCount: 1, type: 'single', cardId: 'joint-lock' }),
      effectType: 'grapple',
      inflictStates: [() => new JointDamageState(1)],
      cardDefinition: {
        title: '叩き潰す',
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
