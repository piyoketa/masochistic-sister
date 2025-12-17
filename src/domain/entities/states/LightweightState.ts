/*
LightweightState.ts の責務:
- 攻撃側のヒット前ダメージを軽量化し（2/3倍）つつ、連撃回数を+1する非スタック状態を実装する。
- pre-hitフェーズで倍率・回数の補正を行い、他フェーズの処理へ影響しないようにする。
- 非スタック仕様を `stackWith` で明示し、同一状態の重複付与で効果が変化しないことを保証する。

責務ではないこと:
- ヒット後の演出制御や、追加スタックの発生源の管理。
- 付与対象の選択ロジック（カードや敵スキル側で判断する）。

主要な通信相手:
- `Attack.calcDamages`: pre-hit計算時に `modifyPreHit` を通じて倍率・回数補正が適用される。
- `Damages`: 適用済みの State として記録され、後続の記憶カード生成に利用される。
*/
import { BadState } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { DamageCalculationParams } from '../Damages'
import { StateAction } from '../Action/StateAction'
import type { CardTag } from '../CardTag'

class LightweightStateAction extends StateAction {
  constructor(state: LightweightState, tags?: CardTag[]) {
    super({
      name: state.name,
      cardDefinition: state.createCardDefinition(),
      tags,
      stateId: state.id,
      sourceState: state,
    })
  }
}

export class LightweightState extends BadState {
  constructor() {
    super({
      id: 'state-lightweight',
      name: '軽量化',
      stackable: false,
      cardDefinition: {
        title: '軽量化',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    return '与ダメージ2/3倍\n与攻撃回数+1\n（累積しない）'
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

    // 軽量化は非スタックなので常に1段の効果を固定適用する。
    const stacks = 1
    const multiplier = 2 / 3

    return {
      ...params,
      amount: params.amount * multiplier,
      count: params.count + stacks,
    }
  }

  override action(tags?: CardTag[]): StateAction {
    return new LightweightStateAction(this, tags)
  }
}
