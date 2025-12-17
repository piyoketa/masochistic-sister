import { Attack } from '../Action/Attack'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'
import { HeavyweightState } from '../states/HeavyweightState'

/**
 * 太らせる: 単体5ダメージ + 対象に重量化を付与するデバフ攻撃。
 */
export class FattenAction extends Attack {
  constructor() {
    super({
      name: '太らせる',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single', cardId: 'fatten' }),
      effectType: 'impact',
      inflictStates: [() => new HeavyweightState()],
      cardDefinition: {
        title: '太らせる',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '単体に5ダメージし、[重量化]1を付与する'
  }
}
