/*
OpenWoundAction.ts（カード「傷が開く」）の責務:
- 手札のアタックカードを1枚選択させ、その複製を手札に加える。
- 発動時にプレイヤーは20のHPを失うデメリットを負う。

責務ではないこと:
- 複製対象カードの強化や改変。複製は元のアタックをそのままコピーする。
- 手札上限超過の調整。手札に空きがなければ `Battle.addCardToPlayerHand` 側の挙動に従う。

主要な通信相手とインターフェース:
- `SelectHandCardOperation`: アタックカードのみ選択可能なフィルターを設定し、選択結果を取得する。
- `Battle.player.takeDamage`: デメリットとしてHPを20減少させる（演出指定なし）。
- `CardRepository`: `duplicateCard` を通じて複製カードを生成する。
- `Battle.addCardToPlayerHand`: 複製したカードを手札に追加し、上限処理を委譲する。
*/
import { Attack, Skill, type ActionContext } from '../Action'
import { ArcaneCardTag, SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'
import type { Operation } from '../operations'
import { SelectHandCardOperation } from '../operations'
import type { Card } from '../Card'
import type { CardRepository } from '../../repository/CardRepository'

const PLAYER_SELF_DAMAGE = 20

export class OpenWoundAction extends Skill {
  constructor() {
    super({
      name: '傷が開く',
      cardDefinition: {
        title: '傷が開く',
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
    return 'HPを20失う\n手札の被虐の記憶を1枚複製する'
  }

  override isActive(context?: { battle?: ActionContext['battle'] }): boolean {
    const battle = context?.battle
    if (!battle) {
      return false
    }
    return this.findAttackCards(battle.hand.list()).length > 0
  }

  protected override buildOperations(): Operation[] {
    return [
      new SelectHandCardOperation({
        filter: (card) => isAttack(card),
        filterMessage: 'アタックを選択してください',
      }),
    ]
  }

  protected override perform(context: ActionContext): void {
    const selectOperation = this.getSelectOperation(context)
    const selected = selectOperation.card

    // デメリット: 自傷ダメージ
    const damage = Math.max(0, Math.floor(PLAYER_SELF_DAMAGE))
    if (damage > 0) {
      context.battle.player.takeDamage(
        {
          actionId: 'open-wound',
          attacker: null,
          defender: { type: 'player' },
          outcomes: [{ damage, effectType: 'bleed' }],
        },
        { battle: context.battle },
      )
    }

    // アタックカードを複製して手札へ追加
    const duplicate = this.duplicateCard(context.battle.cardRepository, selected)
    context.battle.addCardToPlayerHand(duplicate)
  }

  private getSelectOperation(context: ActionContext): SelectHandCardOperation {
    const operation = context.operations?.find(
      (candidate) => candidate.type === SelectHandCardOperation.TYPE,
    ) as SelectHandCardOperation | undefined
    if (!operation) {
      throw new Error('SelectHandCardOperation is required for 傷が開く')
    }
    return operation
  }

  private findAttackCards(cards: Card[]): Card[] {
    return cards.filter((card) => isAttack(card))
  }

  private duplicateCard(repository: CardRepository, card: Card) {
    return repository.duplicateCard(card)
  }
}

function isAttack(card: Card): boolean {
  return card.action instanceof Attack
}
