/*
ReloadAction.ts の責務:
- 状態異常カード（cardType: status）を手元に残し、それ以外の手札を捨て札へ送り、同じ枚数だけ即座に引き直すスキル効果を提供する。
- 処理順序（対象カードの抽出 → 手札からの除去 → 捨て札投入 → ドロー）を明示し、対象カードが存在しない場合は何もせず終了する。
- カードの移動先は常に捨て札で統一し、記憶カード等のタグに依存した例外は設けない。

責務ではないこと:
- ドロー元デッキの不足補充（デッキが空の場合の山札リロードは `Battle.drawForPlayer` が担当する）。
- 捨て札枚数とドロー枚数の差分管理（本アクションでは常に同数を捨てて引く）。

主要な通信相手とインターフェース:
- `Battle.hand`: 現在の手札リストを取得し、各カードを順次除去する。
- `Battle.discardPile`: 捨て札への受け皿として機能し、手札から排除したカードを格納する。
- `Battle.drawForPlayer`: 捨て札枚数と同数のドローを依頼し、リロード効果を完結させる。
*/
import { Skill, type ActionContext } from '../Action'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'

export class ReloadAction extends Skill {
  constructor() {
    super({
      name: '再装填',
      cardDefinition: {
        title: '再装填',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '状態異常以外の手札を捨て、同じ枚数だけ引き直す'
  }

  protected override perform(context: ActionContext): void {
    const hand = context.battle.hand
    const recyclable = hand
      .list()
      .filter((card) => card.definition.cardType !== 'status')
    const discardCount = recyclable.length

    if (discardCount === 0) {
      return
    }

    for (const card of recyclable) {
      hand.remove(card)
    }
    context.battle.discardPile.addMany(recyclable)

    const trashedIds: number[] = []
    const trashedTitles: string[] = []
    recyclable.forEach((card) => {
      if (card.id !== undefined) {
        trashedIds.push(card.id)
        trashedTitles.push(card.title)
      }
    })
    if (trashedIds.length > 0) {
      context.battle.recordCardTrashAnimation({ cardIds: trashedIds, cardTitles: trashedTitles })
    }

    context.battle.drawForPlayer(discardCount)
  }
}
