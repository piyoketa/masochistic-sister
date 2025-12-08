/*
SoloBodyAction.ts（カード「身一つ」）の責務:
- 山札にある「殴打」(TackleAction) を手札上限の許す限りまとめて手札に加える。
- 入力操作は不要で、効果実行時に山札を上から走査し、候補を順次移動する。

責務ではないこと:
- 殴打以外のカード移動や、手札が満杯の場合の強制移動。空きがある分だけ移動し、それ以上は処理しない。
- 手札へ加えたカードの演出制御の細分化。deck-draw 演出を再利用し、個別の移動演出は追加しない。

主要な通信相手とインターフェース:
- `Battle` / `Hand` / `Deck`: 山札の内容取得・手札空き数の計算・指定カードの引き込み (`drawSpecificCard`) を行う。
- `TackleAction`: 候補判定はアクションのクラスで行い、タイトル文字列ではなく型チェックで精度を担保する。
*/
import { Skill, type ActionContext } from '../Action'
import { ArcaneCardTag, SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'
import type { Operation } from '../operations'
import { TackleAction } from './TackleAction'
import type { Card } from '../Card'

export class SoloBodyAction extends Skill {
  constructor() {
    super({
      name: 'この身一つ',
      cardDefinition: {
        title: 'この身一つ',
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
    return '山札の「殴打」を可能な限り手札に加える'
  }

  protected override isActive(context: ActionContext): boolean {
    return this.countAvailable(context) > 0 && this.countHandSpace(context) > 0
  }

  protected override buildOperations(): Operation[] {
    return []
  }

  protected override perform(context: ActionContext): void {
    const handSpace = this.countHandSpace(context)
    if (handSpace <= 0) {
      return
    }
    const tackles = this.collectTacklesFromDeck(context, handSpace)
    let moved = 0
    for (const card of tackles) {
      if (card.id === undefined) {
        continue
      }
      const drawn = context.battle.drawSpecificCard(card.id)
      if (drawn) {
        moved += 1
      }
      if (moved >= handSpace) {
        break
      }
    }
  }

  private countHandSpace(context: ActionContext): number {
    const hand = context.battle.hand
    return Math.max(0, hand.maxSize() - hand.size())
  }

  private countAvailable(context: ActionContext): number {
    return this.collectTacklesFromDeck(context).length
  }

  private collectTacklesFromDeck(context: ActionContext, limit?: number): Card[] {
    const deckCards = context.battle.deck.list()
    const results: Card[] = []
    for (const card of deckCards) {
      if (card.action instanceof TackleAction) {
        results.push(card)
        if (limit !== undefined && results.length >= limit) {
          break
        }
      }
    }
    return results
  }
}

