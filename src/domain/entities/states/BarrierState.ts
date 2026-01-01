/*
BarrierState.ts の責務:
- 防御側が保持するヒット数バリアを管理し、攻撃ヒット時にダメージを0へ書き換える。
- バリア残量の消費と表示用エフェクトの上書きを司る。

責務ではないこと:
- ターン開始時のバリア付与／再生（バリア回復など他Stateが担当）。
- HP減少やBattleログ出力といったバトル全体の処理。

主要な通信相手:
- `Attack`: `onHitResolved` を通じて1ヒット毎に呼び出され、残量を減少させる。
- `GuardianPetalState`: `reset` メソッドを使ってバリア量を初期化する。
- `Battle`: 本State自体はBattleへ直接通知せず、Attack経由でダメージ結果へ反映する。
*/
import { BuffState, type DamageHitContext } from '../State'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'

export class BarrierState extends BuffState {
  constructor(magnitude = 0) {
    super({
      id: 'state-barrier',
      name: 'バリア',
      stackable: true,
      magnitude,
      icon: 'circle-multiple-outline',
    })
  }

  override description(): string {
    const stock = this.magnitude ?? 0
    return `被弾時に<magnitude>${stock}</magnitude>回までダメージを無効化する`
  }

  override get priority(): number {
    return 120
  }

  override isPostHitModifier(): boolean {
    return true
  }

  override affectsDefender(): boolean {
    return true
  }

  override onHitResolved(context: DamageHitContext): boolean {
    if (context.role !== 'defender') {
      return false
    }

    const remaining = this.magnitude ?? 0
    if (remaining <= 0) {
      return false
    }

    if (context.outcome.damage <= 0) {
      return false
    }

    this.consume(1)
    context.outcome.damage = 0
    context.outcome.effectType = 'guarded'
    if ((this.magnitude ?? 0) <= 0) {
      this.removeFromOwner(context.defender)
    }
    return true
  }

  reset(magnitude: number): void {
    this.setMagnitude(Math.max(0, Math.floor(magnitude)))
  }

  private consume(amount: number): void {
    const remaining = this.magnitude ?? 0
    const next = Math.max(0, remaining - Math.max(0, Math.floor(amount)))
    this.setMagnitude(next)
  }


  private removeFromOwner(owner: Player | Enemy): void {
    if ('removeState' in owner && typeof owner.removeState === 'function') {
      owner.removeState(this.id)
    }
  }
}
