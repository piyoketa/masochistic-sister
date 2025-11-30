/*
HeavyweightState.ts の責務:
- 攻撃側のヒット前ダメージを増幅しつつ、連撃回数を圧縮する重量化ステートを表現する。
- 加算倍率（1スタックあたり+50%）とヒット数減少（1スタックごとに-1）を計算へ適用する。

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
  constructor(magnitude = 1) {
    super({
      id: 'state-heavyweight',
      name: '重量化',
      magnitude,
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
    const stacks = this.magnitude ?? 0
    return `攻撃ダメージを${50 * stacks}%増加し、攻撃回数-${stacks}`
  }

  override get priority(): number {
    return 1
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

    const multiplier = 1 + stacks * 0.5
    const reducedCount = Math.max(1, params.count - stacks)

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
