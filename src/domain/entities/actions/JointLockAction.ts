import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'
import { JointDamageState } from '../states/JointDamageState'

export class JointLockAction extends Attack {
  constructor() {
    super({
      name: '締め技',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single' }),
      effectType: 'grapple',
      inflictStates: [() => new JointDamageState(1)],
      cardDefinition: {
        title: '締め技',
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
