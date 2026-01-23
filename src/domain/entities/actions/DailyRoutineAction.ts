/*
DailyRoutineAction.ts の責務:
- シンプルなドロー効果（2枚引く）を提供するスキルカード「日課」を実装する。
- 手札上限を越えた際の挙動は Battle.drawForPlayer に委譲し、ここではドロー要求のみを行う。

責務ではないこと:
- ドローできなかった場合の警告表示やログ出力。ActionLog へのフラグ設定は `Battle.drawForPlayer` → `Battle.applyActionLogEntry` が担う。
- 山札リロードや手札上限処理などの補助ロジック。

主要な通信相手とインターフェース:
- `Battle.drawForPlayer(2)`: 実際のカード移動処理を任せる。
- `ActionContext`: マナ支払い・カード移動は基底 `Skill` が処理するため、ここでは追加処理を行わない。
*/
import { Skill, type ActionContext } from '../Action'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'

export class DailyRoutineAction extends Skill {
  static readonly cardId = 'daily-routine'
  constructor() {
    super({
      name: '日課',
      cardDefinition: {
        title: '日課',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
        subtitle: '祈り',
      },
    })
  }

  protected override description(): string {
    return 'カードを2枚引く'
  }

  protected override perform(context: ActionContext): void {
    context.battle.drawForPlayer(2)
  }
}
