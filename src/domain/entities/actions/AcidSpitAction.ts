import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'
import { CorrosionState } from '../states/CorrosionState'

export class AcidSpitAction extends Attack {
  constructor() {
    super({
      name: '溶かされた',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single' }),
      effectType: 'spit',
      inflictStates: [() => new CorrosionState()],
      cardDefinition: {
        title: '溶かされた',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '対象に腐食(1)を付与する'
  }
}
