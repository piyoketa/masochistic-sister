/*
GlossyLipsState.ts の責務:
- 口技カテゴリのアタックに限定して与ダメージを加算する一時バフを提供する。
- レリック「悪魔の口づけ」などから付与される打点上昇値をプリヒット計算で適用する。

責務ではないこと:
- 口技以外の攻撃や攻撃回数の変更処理（カテゴリ判定のみを担当し、回数は弄らない）。
- 状態の付与源管理やターン維持管理（付与元が決定し、ここでは純粋な計算のみ行う）。

主要な通信相手とインターフェース:
- `Damages.modifyPreHit` フック: 攻撃者ロールのときに口技タグを持つか判定し、`amount` に加算する。
- `Damages.modifyPreHit` フック: `cardId` が口づけ（BloodSuckAction）のものかを判定し、`amount` に加算する。
*/
import { BuffState } from '../State'
import type { DamageCalculationParams } from '../Damages'

const BLOOD_SUCK_CARD_ID = 'blood-suck'

export class GlossyLipsState extends BuffState {
  constructor(magnitude = 0) {
    super({
      id: 'state-glossy-lips',
      name: '艶唇',
      stackable: true,
      magnitude,
    })
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
    return `口技の与ダメージ+${bonus}`
  }

  override get priority(): number {
    // 打点への固定加算なので Strength と同タイミングで処理する
    return 10
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

    const bonus = this.magnitude ?? 0
    if (bonus === 0) {
      return params
    }

    // 口技判定は cardId で厳密に行う。将来タグ構成が変わっても「口づけ」専用の加算であることを保証する。
    if (params.cardId !== BLOOD_SUCK_CARD_ID) {
      return params
    }

    return {
      ...params,
      amount: params.amount + bonus,
    }
  }
}
