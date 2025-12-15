/*
DamageLinkState.ts の責務:
- プレイヤー被弾時に「同じダメージを敵自身も受ける」リンク効果を付与する一時的な状態。
- ターン開始時に自壊し、持続しない。

通信相手とインターフェース:
- Battle.handlePlayerDamageReactions: プレイヤー被弾イベントをトリガーとして、DamageLinkState を持つ敵へ同期ダメージを積む。
- Enemy: 状態の付与/除去先。onTurnStartで自壊する。
*/
import { BadState, State } from '../State'
import type { Battle } from '../../battle/Battle'
import type { Player } from '../Player'
import type { Enemy } from '../Enemy'

export class DamageLinkState extends BadState {
  constructor() {
    super({
      id: 'state-damage-link',
      name: 'ダメージ連動',
      stackable: false,
      cardDefinition: undefined,
    })
  }

  override description(): string {
    return 'プレイヤーが受けたダメージを同時に受ける\nターン開始時に消滅'
  }

  override onTurnStart(context: { battle: Battle; owner: Player | Enemy }): void {
    // ターン開始時に自壊
    context.owner.removeState(this.id, { stateRef: this })
  }

  override stackWith(state: State): void {
    // スタック不可。後から付与しても1つだけ保持。
    if (state.id !== this.id) {
      super.stackWith(state)
    }
  }
}
