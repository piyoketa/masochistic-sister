/*
SacrificialOfferingAction.ts の責務:
- ActiveRelic「贄の自覚」の起動効果を具体的に実行し、プレイヤーに状態異常「贄」を付与する。

非責務:
- レリックの使用回数やマナコストの管理（ActiveRelic 基盤が担当）。
- 入力フローやアニメーション制御（Battle/OperationRunner が担当）。

主な通信相手:
- `Battle` / `Player`: 状態付与先として利用する。
- `SacrificeState`: 付与する状態オブジェクト。
*/
import { Skill, type ActionContext } from '../Action'
import { SkillTypeCardTag } from '../cardTags'
import { SacrificeState } from '../states/SacrificeState'

export class SacrificialOfferingAction extends Skill {
  constructor() {
    super({
      name: '贄の儀式',
      cardDefinition: {
        title: '贄の儀式',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: undefined,
        cost: 0,
        subtitle: '起動効果',
      },
    })
  }

  protected override description(): string {
    return '自身に状態異常「贄」(被ダメージ+50%) を付与する'
  }

  protected override perform(context: ActionContext): void {
    context.battle.player.addState(new SacrificeState(1), { battle: context.battle })
  }
}
