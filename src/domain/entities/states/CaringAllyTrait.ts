/*
CaringAllyTrait.ts の責務:
- 仲間が撃破されるたびに所持者へ打点上昇(+10)を付与する敵専用Traitを提供する。
- 味方撃破イベントでのみ発火し、自身撃破時やターン経過では効果を持たないことを明文化する。

責務ではないこと:
- 打点上昇の効果計算そのもの（`StrengthState` が担う）。
- 撃破イベントの検知（Enemy.takeDamage 側で味方全体に通知する）。

主要な通信相手:
- `Enemy.onAllyDefeated` 通知: 仲間の撃破時に呼ばれ、所持者へ StrengthState(10) を付与する。
- `StrengthState`: 実際の打点補正を担当。累積時は通常のスタック加算が適用される。
*/
import type { Battle } from '../../battle/Battle'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'
import { TraitState } from '../State'
import { StrengthState } from './StrengthState'

export class CaringAllyTrait extends TraitState {
  constructor() {
    super({
      id: 'trait-caring-ally',
      name: '仲間想い',
      stackable: false,
    })
  }

  override description(): string {
    return '味方が撃破される度、打点上昇 10点を得る'
  }

  override onAllyDefeated(context: { battle: Battle; owner: Player | Enemy; ally: Player | Enemy }): void {
    const { battle, owner, ally } = context
    // 所持者自身の死亡では発火しない。敗北済みの所持者にも付与しない。
    if (owner === ally) {
      return
    }
    if ('isActive' in owner && typeof owner.isActive === 'function' && !owner.isActive()) {
      return
    }
    // StrengthStateは通常スタックなので累積可。仲間想いは敵専用想定だが、型上Playerでも動作する。
    owner.addState(new StrengthState(10), { battle })
  }
}
