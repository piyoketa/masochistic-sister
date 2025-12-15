/*
StackedStressState.ts（状態「重なるストレス」）の責務:
- プレイヤーターン中のみ、ダメージ5のアタックのコストを-1する。
- 自分のターン終了時に自動で消滅する（一時的な状態）。

責務ではないこと:
- 5以外のダメージを持つ攻撃のコスト変更。
- ターンをまたいで持続する長期バフ（ターン終了で必ず落ちる）。

主要な通信相手とインターフェース:
- `Action.costAdjustment` 相当で参照されるため、`costAdjustment` を実装し、ダメージ5の Attack かどうかを判定して -1 を返す。
- `StateAction` を経由してカード化し、手札上限や消滅処理は既存 StateAction の仕組みに従う。
*/
import { BuffState } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import { Attack } from '../Action'
import type { CardTag } from '../CardTag'

export class StackedStressState extends BuffState {
  constructor() {
    super({
      id: 'state-stacked-stress',
      name: '重なるストレス',
      stackable: false,
      cardDefinition: {
        title: '重なるストレス',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    return 'このターン、ダメージ5の攻撃カードのコスト-1'
  }

  override onTurnStart(context: { battle: import('../../battle/Battle').Battle; owner: import('../Player').Player | import('../Enemy').Enemy }): void {
    // ターン開始時に自動で消滅させる（一時的なバフのため）。
    this.removeFromOwner(context.owner)
  }

  override costAdjustment(context?: { cardTags?: CardTag[]; action?: Attack }): number {
    const action = context?.action
    if (!(action instanceof Attack)) {
      return 0
    }
    const damages = action.baseDamages
    if (damages.baseAmount !== 5) {
      return 0
    }
    return -1
  }

  private removeFromOwner(owner: import('../Player').Player | import('../Enemy').Enemy): void {
    if ('removeState' in owner && typeof owner.removeState === 'function') {
      owner.removeState(this.id)
    }
  }
}
