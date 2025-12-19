import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'
import { CorrosionState } from '../states/CorrosionState'

export class AcidSpitAction extends Attack {
  constructor() {
    super({
      name: '溶かす',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single', cardId: 'acid-spit' }),
      effectType: 'spit',
      // 腐食は1点=+1ダメージに弱体化したため、付与スタックを10へ引き上げる。
      inflictStates: [() => new CorrosionState(10)],
      cardDefinition: {
        title: '溶かす',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '対象に腐食10点を付与する'
  }
}
