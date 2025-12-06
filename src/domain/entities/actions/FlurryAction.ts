import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, MultiAttackCardTag } from '../cardTags'

// FlurryAction は追加効果のない連続攻撃の汎用アクション。攻撃回数や威力が異なる場合でも
// cloneWithDamages を介して複製し、必要なダメージプロファイルに調整して利用する。
export class FlurryAction extends Attack {
  constructor() {
    super({
      name: '突き刺された',
      baseDamage: new Damages({ baseAmount: 10, baseCount: 2, type: 'multi' }),
      effectType: 'slash',
      cardDefinition: {
        title: '突き刺された',
        cardType: 'attack',
        type: new MultiAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return 'ふつうの連続攻撃'
  }
}
