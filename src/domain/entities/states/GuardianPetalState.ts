/*
GuardianPetalState.ts の責務:
- ターン開始時に所定量のバリアを付与／再生成し、バリア系ステートの維持を保証する。
- バリアの実体生成を調整し、重複生成ではなくリセットに切り替える。

責務ではないこと:
- バリアの消費ロジック（BarrierState が担当）や、逃走判定など他特性との連携。
- ターン終了時の処理。あくまでターン開始トリガーのみを扱う。

主要な通信相手:
- `BarrierState`: 既存バリアを探し `reset` で残量を更新する。
- `Enemy` / `Player`: `addState` を経由してバリアを付与する。
- `Battle`: ここでは参照のみで直接操作しない。
*/
import { TraitState } from '../State'
import { BarrierState } from './BarrierState'
import { Enemy } from '../Enemy'
import type { Battle } from '../../battle/Battle'
import type { Player } from '../Player'

export class GuardianPetalState extends TraitState {
  constructor(magnitude = 0) {
    super({
      id: 'state-guardian-petal',
      name: 'バリア回復',
      stackable: true,
      magnitude,
      icon: 'update',
    })
  }

  override description(): string {
    const charge = this.magnitude ?? 0
    return `ターン開始時、バリアを${charge}点まで回復する`
  }

  override onPlayerTurnStart(context: { battle: Battle; owner: Player | Enemy }): void {
    const desired = Math.max(0, Math.floor(this.magnitude ?? 0))
    if (desired <= 0) {
      return
    }

    const owner = context.owner
    if (owner instanceof Enemy) {
      const existing = owner.states.find((state) => state instanceof BarrierState) as BarrierState | undefined
      if (existing) {
        existing.reset(desired)
        return
      }
      owner.addState(new BarrierState(desired), { battle: context.battle })
      return
    }

    owner.addState(new BarrierState(desired), { battle: context.battle })
  }
}
