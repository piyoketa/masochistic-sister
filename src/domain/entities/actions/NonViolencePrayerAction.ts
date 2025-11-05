/*
NonViolencePrayerAction.ts の責務:
- 手札のアタックカードを選択させ、それを即座に捨て札へ送る代わりにプレイヤーのマナを回復するスキルを実装する。
- カード選択時には `SelectHandCardOperation` でアタック限定フィルターを適用し、誤操作を明確なエラーで防止する。
- 捨て札移動とマナ回復を一括で処理し、カード使用によるマナ支出後のリソース調整を行う。

責務ではないこと:
- マナ上限の制御（`Player.gainMana` が最大値を超えないよう管理する）。
- 捨て札へ送ったカードのタグ処理（消費タグなどは原則無視し、常に捨て札送りとする）。

主要な通信相手とインターフェース:
- `SelectHandCardOperation`: アタックカード判定を `filter` で設定し、結果を `operation.card` として取得する。
- `Battle.hand` / `Battle.discardPile`: 対象カードを手札から除去し、捨て札へ移動させる。
- `Player.gainMana`: 回復処理を委譲し、上限チェックなど既存ロジックを活用する。
*/
import { Skill, type ActionContext } from '../Action'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'
import type { Operation } from '../operations'
import { SelectHandCardOperation } from '../operations'
import type { Card } from '../Card'

export class NonViolencePrayerAction extends Skill {
  constructor() {
    super({
      name: '非暴力の祈り',
      cardDefinition: {
        title: '非暴力の祈り',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 0,
      },
    })
  }

  protected override description(): string {
    return '手札のアタックを捨て札へ送り、失ったマナを取り戻す'
  }

  protected override buildOperations(): Operation[] {
    return [
      new SelectHandCardOperation({
        filter: (card) => isAttackCard(card),
        filterMessage: 'アタックカードを選択してください',
      }),
    ]
  }

  protected override perform(context: ActionContext): void {
    const selectOperation = this.getSelectOperation(context)
    const selectedCard = selectOperation.card

    context.battle.hand.remove(selectedCard)
    context.battle.discardPile.add(selectedCard)
    context.battle.player.gainMana(1)
  }

  private getSelectOperation(context: ActionContext): SelectHandCardOperation {
    const operation = context.operations?.find(
      (candidate) => candidate.type === SelectHandCardOperation.TYPE,
    ) as SelectHandCardOperation | undefined

    if (!operation) {
      throw new Error('SelectHandCardOperation is required for NonViolencePrayerAction')
    }

    return operation
  }
}

function isAttackCard(card: Card): boolean {
  const action = card.action
  return Boolean(action && action.type === 'attack')
}
