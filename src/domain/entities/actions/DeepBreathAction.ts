/*
DeepBreathAction.ts（カード「深呼吸」）の責務:
- 捨て札のカードをすべて山札へ戻してシャッフルし、その後1枚ドローする。
- 手札が満杯の場合は既存の draw 処理に従い、ドローがスキップされるだけでエラーにしない。

責務ではないこと:
- 個別のカード順序操作や特殊な再配置。戻し方は単純に捨て札全体を山札に戻してシャッフルに委ねる。
- 複数枚ドローや追加効果。常に1枚のみドローする。

主要な通信相手とインターフェース:
- `Battle.discardPile.takeAll()` で捨て札を回収し、`Battle.deck.addManyToBottom` と `shuffle` で山札へ戻す。
- `Battle.drawForPlayer(1)` でドローし、既存の deck-draw 演出キューを活用する。
*/
import { Skill, type ActionContext } from '../Action'
import { SkillTypeCardTag, SelfTargetCardTag, ArcaneCardTag } from '../cardTags'
import type { Operation } from '../operations'

export class DeepBreathAction extends Skill {
  constructor() {
    super({
      name: '深呼吸',
      cardDefinition: {
        title: '深呼吸',
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
    return '捨て札をすべて山札に戻してシャッフルし、1枚ドローする'
  }

  // isAvailable 要件を受け、名前を isActive として実装する
  override isActive(context?: { battle?: ActionContext['battle'] }): boolean {
    const battle = context?.battle
    if (!battle) {
      return false
    }
    // 山札か捨て札に1枚以上あれば実行可能とする
    const deckCount = battle.deck.size()
    const discardCount = battle.discardPile.size ? battle.discardPile.size() : battle.discardPile.list().length
    return deckCount + discardCount > 0
  }

  protected override buildOperations(): Operation[] {
    return []
  }

  protected override perform(context: ActionContext): void {
    // 捨て札をすべて山札へ戻してシャッフル
    const discardCards = context.battle.discardPile.takeAll()
    if (discardCards.length > 0) {
      context.battle.deck.addManyToBottom(discardCards)
      context.battle.deck.shuffle()
    }

    // 1枚ドロー。手札が満杯なら drawForPlayer がスキップ判定を行う。
    context.battle.drawForPlayer(1)
  }
}
