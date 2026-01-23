/*
PredicamentAction.ts の責務:
- スキルカード「窮地」を実装し、手札に存在する状態異常カードの枚数だけ追加ドローする効果を提供する。
- ドロー要求のみを行い、山札リロードや上限超過時の処理は Battle 側 (`drawForPlayer`) に委譲する。

責務ではないこと:
- 状態異常カードの判定ロジックの変更（cardType が 'status' であるかを確認するだけ）。
- 0枚ドロー時の UI 通知やログ出力。ドロー処理が発生しないケースは静かに終了する。

主要な通信相手とインターフェース:
- `Battle.hand`: 手札のカード一覧から cardType が 'status' のカード枚数を算出する。
- `Battle.drawForPlayer(count)`: 算出した枚数分のドローを依頼する。ドロー結果のログ・アニメーションは Battle 側が扱う。
*/
import { Skill, type ActionContext } from '../Action'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'

export class PredicamentAction extends Skill {
  static readonly cardId = 'predicament'
  constructor() {
    super({
      name: '窮地',
      cardDefinition: {
        title: '窮地',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 0,
        subtitle: '',
      },
    })
  }

  protected override description(): string {
    return '手札の状態異常の枚数だけカードを引く'
  }

  protected override perform(context: ActionContext): void {
    const statusCount = context.battle.hand
      .list()
      .filter((card) => card.definition.cardType === 'status').length

    if (statusCount <= 0) {
      return
    }
    context.battle.drawForPlayer(statusCount)
  }
}
