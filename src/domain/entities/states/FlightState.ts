/*
FlightState.ts の責務:
- ダメージ固定状態のキャラクターが受ける攻撃ダメージをヒット毎に1へ制限する。
- pre-hitフェーズでダメージ量を上書きし、他のState（防御など）よりも後段の処理を阻害しない。

責務ではないこと:
- 命中判定や回避などダメージ固定に伴う別効果。ここではダメージ上限のみを扱う。
- ヒット回数操作（粘液等が担当）。

主要な通信相手:
- `Attack.calcDamages`: pre-hit計算時に `modifyPreHit` が呼び出され、1ダメージへ書き換える。
- `Damages`: 被ダメージ上限を反映した結果を保持し、後続でUIへ伝達する。
*/
import { TraitState } from '../State'
import type { DamageCalculationParams } from '../Damages'

export class FlightState extends TraitState {
  constructor() {
    super({
      id: 'state-flight',
      name: 'ダメージ固定',
      stackable: false,
    })
  }

  override description(): string {
    return '攻撃によるダメージは常に1になる'
  }

  override get priority(): number {
    return 120
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

    if (params.amount <= 0) {
      return params
    }

    return {
      ...params,
      amount: 1,
    }
  }
}
