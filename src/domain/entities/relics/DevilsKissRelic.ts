/*
DevilsKissRelic.ts の責務:
- レリック「悪魔の口づけ」の永続効果を定義し、状態異常カード枚数に応じた「艶唇」バフをプレイヤーへ付与する。
- レリックの有効判定や説明文、UI表示用アイコンを提供する。

責務ではないこと:
- 状態異常カードの生成・破棄管理（Battle/Player 側が行う）。
- 付与された「艶唇」以外の打点計算や演出の制御（State や Attack 側が担う）。

主要な通信相手とインターフェース:
- `Player.countBaseStatusStates`: 手札にある状態異常カード枚数を参照し、バフの強さを決定する。
- `GlossyLipsState`: 付与するバフの実体。`getAdditionalStates` で magnitude を設定したインスタンスを返す。
- `Battle`: スナップショット生成時に `getAdditionalStates` を通じてプレイヤー状態へ組み込まれる。
*/
import { Relic } from './Relic'
import { GlossyLipsState } from '../states/GlossyLipsState'
import type { Battle } from '@/domain/battle/Battle'
import type { Player } from '../Player'

export class DevilsKissRelic extends Relic {
  readonly id = 'devils-kiss'
  readonly name = '悪魔の口づけ'
  readonly usageType = 'passive' as const
  readonly icon = '💋'

  description(): string {
    return '自身の状態異常カード枚数×10だけ口技の打点を上昇させる'
  }

  override isActive(context?: { battle?: Battle; player?: Player }): boolean {
    if (context?.player) {
      return context.player.countBaseStatusStates() > 0
    }
    return false
  }

  override getAdditionalStates(context?: { battle?: Battle; player?: Player }) {
    const player = context?.player
    if (!player) {
      return []
    }
    const statusCount = player.countBaseStatusStates()
    if (statusCount <= 0) {
      return []
    }
    // 手札状態異常1枚につき口技打点+10。艶唇を通して口技に限定して加算する。
    return [new GlossyLipsState(statusCount * 10)]
  }
}
