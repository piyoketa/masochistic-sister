/*
LightweightState.ts の責務:
- 攻撃側のヒット前ダメージをスタック量に応じて減衰させ、連撃回数を増やす軽量化ステートを表現する。
- スタック可とし、magnitude(=X点)を 2/(2+X) 倍の打点減衰と、連続攻撃回数+Xとして計算へ適用する。
- 連撃判定には `DamagePattern` を用い、count>1 といった回数からの推測を避ける。

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
  constructor(magnitude = 1) {
    super({
      id: 'state-lightweight',
      name: '軽量化',
      stackable: true,
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
    const multiplier = 2 / (2 + stacks)
    return `攻撃時の打点が<magnitude>${stacks}</magnitude>段階下がる\n(2/<magnitude>${2+stacks}</magnitude>になる)\n連続攻撃の回数+<magnitude>${stacks}</magnitude>`
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

    // 仕様: ダメージは 2/(2+X) 倍、連撃回数は DamagePattern が multi の時だけ +X。
    const stacks = Math.max(0, this.magnitude ?? 0)
    const multiplier = 2 / (2 + stacks)
    const isMultiAttack = params.type === 'multi'
    const nextCount = isMultiAttack ? params.count + stacks : params.count

    return {
      ...params,
      amount: params.amount * multiplier,
      count: nextCount,
    }
  }

  override action(tags?: CardTag[]): StateAction {
    return new LightweightStateAction(this, tags)
  }
}
