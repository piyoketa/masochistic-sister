/*
LightweightCombatRelic の責務:
- 手札に「腐食」状態が存在する間、加速(1)を付与するパッシブレリックとして振る舞う。
- 付与する状態は Battle 側で評価される前提のため、State を返すだけに留める。

非責務:
- 「腐食」カードの生成や手札構築の管理（Battle/デッキ構築側が担当）。
- 加速の具体的な効果の適用（AccelerationState が担当）。

主な通信相手:
- `Player`: `hasBaseStateOfType` により手札内の腐食存在を判定する。
- `Battle`: 取得済みの State を適用して戦闘中の補正として扱う。
- `CorrosionState` / `AccelerationState`: 発動条件と付与する状態の定義。
*/
import { Relic } from './Relic'
import { CorrosionState, AccelerationState } from '../states'
export class LightweightCombatRelic extends Relic {
  readonly id = 'lightweight-combat'
  readonly name = '軽装戦闘'
  readonly usageType = 'passive' as const
  readonly icon = '🪶'

  description(): string {
    return '手札に「腐食」がある時、+加速(1)'
  }

  override isActive(context?: { battle?: import('@/domain/battle/Battle').Battle; player?: import('../Player').Player }): boolean {
    if (!context?.player) return false
    return context.player.hasBaseStateOfType(CorrosionState)
  }

  override getAdditionalStates(context?: {
    battle?: import('@/domain/battle/Battle').Battle
    player?: import('../Player').Player
  }): import('../State').State[] {
    if (!context?.battle || !context?.player) {
      return []
    }
    if (!this.isActive(context)) {
      return []
    }
    // 酩酊など他の補正と同様に State で表現する。累積も考慮し magnitude=1 を返す。
    return [new AccelerationState(1)]
  }
}
