/*
ScarRegenerationAction.ts の責務:
- 手札内の記憶カードを1枚選択させ、その複製を生成して同じく手札へ加えるスキルアクションを提供する。
- 選択対象は `SelectHandCardOperation` のフィルター機能で制限し、誤選択時には明示的なエラーメッセージを返す。
- 複製カードの生成には `CardRepository` を利用し、リポジトリIDを割り振ったうえで手札ゾーンへ登録する。

責務ではないこと:
- 複製対象カードの内容を編集・強化する処理（元カードと同一の仕様で生成するに留める）。
- 生成後の記憶カード消費やドロー調整等、追加的なリソース操作。必要があれば呼び出し元のカードが別途処理する。

主要な通信相手とインターフェース:
- `SelectHandCardOperation`: 記憶カードのみ選択できるようフィルターを設定し、完了後に `operation.card` から対象を取得する。
- `CardRepository`: `create` を通じて新たな `Card` インスタンスにIDを割り振り、手札へ安全に追加する。
- `Battle.addCardToPlayerHand`: 生成した複製カードを戦闘の手札ゾーンに投入する。`Card.copyWith` を使うことで `Card` の持つ `Action`/`State` をそのまま引き継ぐ。
*/
import { Skill, type ActionContext } from '../Action'
import {
  ArcaneCardTag,
  ExhaustCardTag,
  SelfTargetCardTag,
  SkillTypeCardTag,
} from '../cardTags'
import type { Operation } from '../operations'
import { SelectHandCardOperation } from '../operations'
import type { Card } from '../Card'

const MEMORY_TAG_ID = 'tag-memory'

export class ScarRegenerationAction extends Skill {
  constructor() {
    super({
      name: '疼き',
      cardDefinition: {
        title: '疼き',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
        cardTags: [new ArcaneCardTag(), new ExhaustCardTag()],
      },
    })
  }

  protected override description(): string {
    return '手札の[記憶]カード１枚を選択する。選択したカードの複製を手札に加える'
  }

  protected override buildOperations(): Operation[] {
    return [
      new SelectHandCardOperation({
        filter: (card) => isMemoryCard(card),
        filterMessage: '記憶カードを選択してください',
      }),
    ]
  }

  protected override perform(context: ActionContext): void {
    const selectOperation = this.getSelectOperation(context)
    const selected = selectOperation.card

    const duplicate = context.battle.cardRepository.create(() => selected.copyWith({}))
    context.battle.addCardToPlayerHand(duplicate)
  }

  private getSelectOperation(context: ActionContext): SelectHandCardOperation {
    const operation = context.operations?.find(
      (candidate) => candidate.type === SelectHandCardOperation.TYPE,
    ) as SelectHandCardOperation | undefined

    if (!operation) {
      throw new Error('SelectHandCardOperation is required for ScarRegenerationAction')
    }

    return operation
  }
}

function isMemoryCard(card: Card): boolean {
  return (card.cardTags ?? []).some((tag) => tag.id === MEMORY_TAG_ID)
}
