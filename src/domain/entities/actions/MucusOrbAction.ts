/*
MucusOrbAction.ts の責務:
- 起動レリック「粘液玉」の効果として、プレイヤー自身に状態異常「粘液」を1点付与する。
- 起動効果の説明とカード定義を提供し、ActionLog/表示の整合を保つ。

非責務:
- レリックの使用回数やマナコスト管理（ActiveRelic が担当）。
- 「粘液」状態の具体的な効果や表示（StickyState が担当）。

主な通信相手:
- `Battle` / `Player`: 状態付与先として利用する。
- `StickyState`: 付与する状態オブジェクト。
*/
import { Skill, type ActionContext } from '../Action'
import { SkillTypeCardTag } from '../cardTags'
import { StickyState } from '../states/StickyState'

export class MucusOrbAction extends Skill {
  constructor() {
    super({
      name: '粘液玉',
      cardDefinition: {
        title: '粘液玉',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: undefined,
        cost: 0,
        subtitle: '起動効果',
      },
    })
  }

  protected override description(): string {
    return '自身に状態異常「粘液(1点)」を付与する'
  }

  protected override perform(context: ActionContext): void {
    // 起動レリックは常にプレイヤー自身へ作用させる設計のため、対象は battle.player に固定する。
    context.battle.player.addState(new StickyState(1), { battle: context.battle })
  }
}
