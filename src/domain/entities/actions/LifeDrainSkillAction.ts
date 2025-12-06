/*
LifeDrainSkillAction.ts の責務:
- 指定した[単撃]カードへ一時的にドレイン効果を付与し、次の自分ターン開始時まで効力を維持させる。
- 選択可能カードの条件を `SelectHandCardOperation` で制約し、誤操作を防ぐ。
- 付与したドレインタグの除去スケジュールをバトルイベントへ登録し、期間限定効果を管理する。

責務ではないこと:
- 実際の攻撃時のドレイン処理（`Attack` クラスがカードタグを参照して実施する）。
- カードの移動や消費などプレイ後のゾーン遷移管理。

主要な通信相手とインターフェース:
- `SelectHandCardOperation`: 手札から対象カードを選択し、選択結果を `context.operations` 経由で受け取る。
- `Battle`: イベントキューへタグ除去用のカスタムイベントを登録し、ターン管理情報を参照する。
- `Card`: `addTemporaryTag` / `removeTemporaryTag` を通じてドレインタグの付与・解除を制御する。
*/
import { Skill, type ActionContext } from '../Action'
import {
  ArcaneCardTag,
  SelfTargetCardTag,
  SkillTypeCardTag,
  DrainCardTag,
} from '../cardTags'
import { SelectHandCardOperation, type Operation } from '../operations'
import type { Card } from '../Card'

export class LifeDrainSkillAction extends Skill {
  constructor() {
    super({
      name: '生命収奪',
      cardDefinition: {
        title: '生命収奪',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
        subtitle: '',
        categoryTags: [new ArcaneCardTag()],
      },
    })
  }

  protected override description(): string {
    return 'このターン、手札の[一回攻撃]1枚に[ドレイン]を付与'
  }

  protected override buildOperations(): Operation[] {
    return [
      new SelectHandCardOperation({
        filter: (card) => this.isSingleAttackCard(card),
        filterMessage: '選択できるのは[単撃]のカードのみです',
      }),
    ]
  }

  protected override perform(context: ActionContext): void {
    const operation = this.extractSelectionOperation(context)
    const card = operation.card
    const cardId = card.id
    if (cardId === undefined) {
      throw new Error('生命収奪の対象カードにIDが割り当てられていません')
    }

    card.addTemporaryTag(new DrainCardTag())

    const battle = context.battle
    const scheduledTurn = battle.turn.current.turnCount + 1
    battle.enqueueEvent({
      id: battle.createEventId(),
      type: 'custom',
      payload: {
        action: 'remove-card-tag',
        cardId,
        tagId: 'tag-drain',
      },
      scheduledTurn,
    })
  }

  private extractSelectionOperation(context: ActionContext): SelectHandCardOperation {
    const operation = context.operations?.find(
      (candidate): candidate is SelectHandCardOperation =>
        candidate.type === SelectHandCardOperation.TYPE,
    )
    if (!operation) {
      throw new Error('生命収奪の手札選択操作が見つかりませんでした')
    }
    return operation
  }

  private isSingleAttackCard(card: Card): boolean {
    return card.definition.cardType === 'attack' && card.definition.type.id === 'tag-type-single-attack'
  }
}
