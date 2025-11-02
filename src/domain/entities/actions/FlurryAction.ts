import { Attack } from '../Action'
import { Damages } from '../Damages'

// FlurryAction は追加効果のない連続攻撃の汎用アクション。攻撃回数や威力が異なる場合でも
// cloneWithDamages を介して複製し、必要なダメージプロファイルに調整して利用する。
export class FlurryAction extends Attack {
  constructor() {
    super({
      name: '乱れ突き',
      baseDamage: new Damages({ baseAmount: 10, baseCount: 2, type: 'multi' }),
      cardDefinition: {
        title: '乱れ突き',
        type: 'attack',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '敵単体に10ダメージを2回与える'
  }
}
