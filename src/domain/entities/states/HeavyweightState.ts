/*
HeavyweightState.ts の責務:
- 攻撃側のヒット前ダメージをスタック量に応じて増幅し、連撃回数を減少させる重量化ステートを表現する。
- スタック可とし、magnitude(=X点)を (2+X)/2 倍の打点増幅と、連続攻撃回数-Xの減少として計算へ適用する。
- 連撃かどうかの判定には `DamagePattern` を用い、count>1 などの回数から逆算しない。

責務ではないこと:
- ヒット後処理やバリアとの整合性。これらは Attack 側および他Stateが担う。
- スタックの付与・除去ロジック（Action等が担当）。

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
      stackable: true,
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
    return `攻撃時の打点が<magnitude>${stacks}</magnitude>段階上がる\n(<magnitude>${2+stacks}</magnitude>/2になる)\n連続攻撃の回数-<magnitude>${stacks}</magnitude>`
  }

  override get priority(): number {
    return 15
  }

  override affectsAttacker(): boolean {
  }

  override isPreHitModifier(): boolean {
    return true
  }

  override modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'attacker') {
      return params
    }

    // 仕様: ダメージは (2+X)/2 倍、連撃回数は DamagePattern が multi の時だけ -X。
    const stacks = Math.max(0, this.magnitude ?? 0)
    const multiplier = (2 + stacks) / 2
    const isMultiAttack = params.type === 'multi'
    const nextCount = isMultiAttack ? Math.max(1, params.count - stacks) : params.count

    return {
      ...params,
      amount: params.amount * multiplier,
      count: nextCount,
    }
  }

  override action(tags?: CardTag[]): StateAction {
    return new HeavyweightStateAction(this, tags)
  }
}
