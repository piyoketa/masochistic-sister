/*
SacrificeState.ts の責務:
- 状態異常「贄」を表し、所持者が受けるダメージを増加させる。
- Stack された量に応じて増加率を累積させ、戦闘ログに反映されるようにする。

非責務:
- 付与トリガーや解除方法の管理（付与元のレリック/カードが担当）。
- アニメーション制御（Battle/OperationRunner が担当）。

主な通信相手:
- ダメージ計算 (`DamageCalculationParams`): 被ダメージ側として参照され、増加補正を適用する。
- Battle/Player: 付与/解除の対象として利用される。
*/
import { BadState } from '../State'
import type { DamageCalculationParams } from '../Damages'

export class SacrificeState extends BadState {
  constructor(magnitude = 1) {
    super({
      id: 'state-sacrifice',
      name: '贄',
      stackable: true,
      magnitude,
    })
  }

  override description(): string {
    const bonus = (this.magnitude ?? 0) * 50
    return `被ダメージ+${bonus}%（累積可）`
  }

  override affectsDefender(): boolean {
    return true
  }

  override isPreHitModifier(): boolean {
    return true
  }

  override modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'defender') {
      return params
    }
    const stacks = this.magnitude ?? 0
    if (stacks <= 0) {
      return params
    }
    // 50%ずつ累積で被ダメージを増加させる。丸めは他の増減と同じく Math.floor に委ねる。
    const factor = 1 + 0.5 * stacks
    return {
      ...params,
      amount: Math.floor(params.amount * factor),
    }
  }
}
