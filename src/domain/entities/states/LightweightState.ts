/*
LightweightState.ts の責務:
- 攻撃側のヒット前ダメージを軽量化し（1スタック毎に2/3倍）、連撃回数を増やす効果を実装する。
- pre-hitフェーズで倍率・回数の補正を行い、他フェーズの処理へ影響しないようにする。

責務ではないこと:
- ヒット後の演出制御や、追加スタックの発生源の管理。
- 付与対象の選択ロジック（カードや敵スキル側で判断する）。

主要な通信相手:
- `Attack.calcDamages`: pre-hit計算時に `modifyPreHit` を通じて倍率・回数補正が適用される。
- `Damages`: 適用済みの State として記録され、後続の記憶カード生成に利用される。
*/
import { State } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { DamageCalculationParams } from '../Damages'

export class LightweightState extends State {
  constructor(magnitude = 1) {
    super({
      id: 'state-lightweight',
      name: '軽量化',
      magnitude,
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
    const stacks = this.magnitude ?? 0
    return `攻撃ダメージを(2/3)^${stacks}倍、攻撃回数+${stacks}`
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

    const stacks = Math.max(0, this.magnitude ?? 0)
    if (stacks === 0) {
      return params
    }

    const multiplier = (2 / 3) ** stacks

    return {
      ...params,
      amount: params.amount * multiplier,
      count: params.count + stacks,
    }
  }
}
