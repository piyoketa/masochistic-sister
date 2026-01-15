/*
MemoRelicAction.ts の責務:
- 起動レリック「メモ」の効果として、手札から1枚選択し「保留」タグを付与する。
- `SelectHandCardOperation` を通じて選択入力を受け取り、対象カードへ反映する。

非責務:
- ターン終了時の手札破棄ルール（Battle が担当）。
- タグ表示のUI制御（View が担当）。

主な通信相手:
- `SelectHandCardOperation`: `buildOperations` で選択入力を要求し、`operation.card` で対象を取得する。
- `Card`: `addTemporaryTag` で「保留」タグを付与する。
- `RetainCardTag`: 付与するタグの定義。
*/
import { Skill, type ActionContext } from '../Action'
import { RetainCardTag, SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'
import { SelectHandCardOperation } from '../operations'
import type { Operation } from '../operations'

export class MemoRelicAction extends Skill {
  constructor() {
    super({
      name: 'メモ',
      cardDefinition: {
        title: 'メモ',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 0,
        subtitle: '起動効果',
      },
    })
  }

  protected override description(): string {
    return '手札1枚を選択し、そのカードに「保留」を付与する'
  }

  protected override buildOperations(): Operation[] {
    return [new SelectHandCardOperation()]
  }

  protected override perform(context: ActionContext): void {
    const selectOperation = this.getSelectOperation(context)
    const selectedCard = selectOperation.card

    // 「保留」はカード定義ではなくカードインスタンスに付与し、戦闘中のみ効果が持続する設計とする。
    selectedCard.addTemporaryTag(new RetainCardTag())
  }

  private getSelectOperation(context: ActionContext): SelectHandCardOperation {
    const operation = context.operations?.find(
      (candidate) => candidate.type === SelectHandCardOperation.TYPE,
    ) as SelectHandCardOperation | undefined
    if (!operation) {
      throw new Error('SelectHandCardOperation is required for メモ')
    }
    return operation
  }
}
