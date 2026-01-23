/*
ScarRegenerationAction.ts（カード「疼き」）の責務:
- 手札内の記憶カードを1枚選択させ、その複製を生成して同じく手札へ加える。
- 選択対象は `SelectHandCardOperation` のフィルター機能で制限し、誤選択時には明示的なエラーメッセージを返す。
- 複製カード生成は `CardRepository` に委譲し、`Battle.addCardToPlayerHand` を通じて手札へ追加する。

責務ではないこと:
- 複製対象カードの強化や改変。複製は原則として同一のカード特性を維持する。
- 手札上限の調整やカード移動後の副作用処理（捨て札・消滅など）。

主要な通信相手とインターフェース:
- `SelectHandCardOperation`: 記憶カードのみ選択できるようフィルターを設定し、結果を `operation.card` から取得する。
- `CardRepository`: `create` を通じて新たなカードインスタンスにリポジトリIDを割り振る。
- `Battle.addCardToPlayerHand`: 手札追加と手札上限管理を一元化する。
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
import type { CardRepository } from '../../repository/CardRepository'

const MEMORY_TAG_ID = 'tag-memory'

export class ScarRegenerationAction extends Skill {
  static readonly cardId = 'scar-regeneration'
  constructor() {
    super({
      name: '疼き',
      cardDefinition: {
        title: '疼き',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
        subtitle: '',
        effectTags: [new ExhaustCardTag()],
        categoryTags: [new ArcaneCardTag()],
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

    // 複製時は [新規] タグを外し、代わりに [複製] タグを付与するため CardRepository のユーティリティを使用する
    const duplicate = this.duplicateCard(context.battle.cardRepository, selected)
    context.battle.addCardToPlayerHand(duplicate)
  }

  private getSelectOperation(context: ActionContext): SelectHandCardOperation {
    const operation = context.operations?.find(
      (candidate) => candidate.type === SelectHandCardOperation.TYPE,
    ) as SelectHandCardOperation | undefined

    if (!operation) {
      throw new Error('SelectHandCardOperation is required for 疼き')
    }

    return operation
  }

  private duplicateCard(repository: CardRepository, card: Card) {
    return repository.duplicateCard(card)
  }
}

function isMemoryCard(card: Card): boolean {
  return (card.cardTags ?? []).some((tag) => tag.id === MEMORY_TAG_ID)
}
