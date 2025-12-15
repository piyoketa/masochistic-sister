/*
HeavyweightState.ts の責務:
- 攻撃側のヒット前ダメージを増幅しつつ、連撃回数を圧縮する重量化ステートを表現する。
- 加算倍率（1スタックあたり+50%）とヒット数減少（1スタックごとに-1）を計算へ適用する。
- 非スタック仕様を担保し、同一状態の重複付与で効果が強化されないようにする。

責務ではないこと:
- ヒット後処理やバリアとの整合性。これらは Attack 側および他Stateが担う。
- スタック制御の外部調整（付与・解除はAction等が担当）。

主要な通信相手:
- `Attack.calcDamages`: pre-hit段階で `modifyPreHit` が呼び出され、ダメージ倍率と回数補正を適用する。
- `Damages`: 適用済みStateとして記録され、記憶カードなどへ情報を提供する。
*/
import { BadState } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { DamageCalculationParams } from '../Damages'
import { StateAction } from '../Action/StateAction'
import type { CardTag } from '../CardTag'

class HeavyweightStateAction extends StateAction {
  constructor(state: HeavyweightState, tags?: CardTag[]) {
    super({
      name: state.name,
      cardDefinition: state.createCardDefinition(),
      tags,
      stateId: state.id,
      sourceState: state,
    })
  }
}

export class HeavyweightState extends BadState {
  constructor() {
    super({
      id: 'state-heavyweight',
      name: '重量化',
      stackable: false,
      cardDefinition: {
        title: '重量化',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    return '与ダメージ+50%\n与攻撃回数-1\n（累積しない）'
  }

  override get priority(): number {
    return 15
  }

  override affectsAttacker(): boolean {
    return true
  }

  override isPreHitModifier(): boolean {
    return true
  }

  override modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'attacker') {
      return params
    }

    // スタックしない前提で、固定倍率(+50%)と回数-1を適用する。
    const multiplier = 1.5
    const reducedCount = Math.max(1, params.count - 1)

    return {
      ...params,
      amount: params.amount * multiplier,
      count: reducedCount,
    }
  }

  override action(tags?: CardTag[]): StateAction {
    return new HeavyweightStateAction(this, tags)
  }
}
