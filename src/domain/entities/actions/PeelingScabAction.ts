/*
PeelingScabAction.ts（カード「剥がれた瘡蓋」）の責務:
- 山札から「ダメージ5のアタック」カードを1枚選択させ、手札に加える。
- 選択操作は新Operation `SelectPileCardOperation`（pile=deck）で収集し、選択されたカードを山札から取り除いた上で手札へ移動する。
- 手札追加は既存の draw 演出（deck-draw ステージ）に統一するため、Battle のドローイベントキューにカードIDを積む経路を利用する。

責務ではないこと:
- 複数枚の同時選択や山札以外の選択。捨て札など他の pile は対象外。
- ダメージ5以外の攻撃や、バフ込みで5ダメージになるかどうかの判定。カード定義の DamagePattern.amount が 5 の攻撃のみを対象とする。

主要な通信相手とインターフェース:
- `SelectPileCardOperation` (pile=deck): 山札から cardId を選ばせ、`operation.card` で取得する。
- `Battle.deck` / `Battle.hand`: 選択カードを山札から取り除き、手札へ追加する。
- `Battle.recordDrawAnimationEvents`（既存のドローイベントキュー）: deck-draw ステージに統合するため、手札追加時にカードIDを渡す。
*/
import { Attack, Skill, type ActionContext } from '../Action'
import {
  ArcaneCardTag,
  SkillTypeCardTag,
  SelfTargetCardTag,
} from '../cardTags'
import type { Operation } from '../operations'
import { SelectPileCardOperation } from '../operations'
import type { Card } from '../Card'
import type { OperationContext } from '../operations/OperationBase'

export class PeelingScabAction extends Skill {
  constructor() {
    super({
      name: '剥がれた瘡蓋',
      cardDefinition: {
        title: '剥がれた瘡蓋',
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
    return '山札からダメージ5の攻撃カードを1枚選んで手札に加える'
  }

  override isActive(context: ActionContext): boolean {
    return this.findEligibleCardsInDeck(context).length > 0
  }

  protected override buildOperations(): Operation[] {
    return [new SelectPileCardOperation('deck')]
  }

  protected override perform(context: ActionContext): void {
    const operation = this.getSelectOperation(context)
    const selectedCard = operation.card
    const cardId = selectedCard.id
    if (cardId === undefined) {
      throw new Error('選択したカードにIDがありません')
    }
    // デバッグ用: perform 開始時に選択カードを記録
    // eslint-disable-next-line no-console
    console.info('[PeelingScabAction] perform start', { cardId, title: selectedCard.title })
    const drawn = context.battle.drawSpecificCard(cardId)
    if (!drawn) {
      throw new Error('山札からカードを取得できませんでした')
    }
  }

  /** 山札に存在する「ダメージ5のアタック」を検索する */
  private findEligibleCardsInDeck(context: { battle: ActionContext['battle'] }): Card[] {
    return context.battle.deck
      .list()
      .filter((card) => isDamage5Attack(card))
  }

  private getSelectOperation(context: ActionContext): SelectPileCardOperation {
    const operation = context.operations?.find(
      (candidate) => candidate.type === SelectPileCardOperation.TYPE,
    ) as SelectPileCardOperation | undefined
    if (!operation) {
      throw new Error('select-pile-card operation is required for 剥がれた瘡蓋')
    }
    return operation
  }

  override describePileSelectionCandidates(context: OperationContext): { pile: 'deck'; cardIds: number[] } {
    const ids = this.findEligibleCardsInDeck(context)
      .map((card) => card.id)
      .filter((id): id is number => typeof id === 'number')
    return { pile: 'deck', cardIds: ids }
  }
}

function isDamage5Attack(card: Card): boolean {
  const definition = card.definition
  if (!definition || definition.cardType !== 'attack') {
    return false
  }
  const attack = card.action as Attack
  const amount = attack.baseDamages.amount
  if (typeof amount !== 'number') {
    return false
  }
  return amount === 5
}
