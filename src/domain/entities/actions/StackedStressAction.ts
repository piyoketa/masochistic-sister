/*
StackedStressAction.ts（カード「重なるストレス」）の責務:
- プレイヤーに一時的な状態「重なるストレス」を付与し、このターン中のダメージ5アタックのコストを-1する。
- 入力操作は不要で、即座に自身へ状態を付与するだけのシンプルなスキルとして振る舞う。

責務ではないこと:
- 5以外の攻撃やターンを跨いだコスト調整。ターン終了時に状態が消滅するため永続効果は持たない。
- ダメージや手札操作など、コスト以外の効果は持たない。

主要な通信相手とインターフェース:
- `gainStates`: 状態付与処理を Skill 基底へ委譲し、`StackedStressState` を自身に付与する。
- `StackedStressState`: costAdjustment で Attack のダメージ量を判定し、ダメージ5攻撃のコストを-1する。
*/
import { Skill } from '../Action/Skill'
import { StackedStressState } from '../states/StackedStressState'
import { ArcaneCardTag, SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'

export class StackedStressAction extends Skill {
  static readonly cardId = 'stacked-stress'
  constructor() {
    super({
      name: '重なるストレス',
      cardDefinition: {
        title: '重なるストレス',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
        subtitle: '',
        categoryTags: [new ArcaneCardTag()],
      },
      gainStates: [() => new StackedStressState()],
    })
  }

  protected override description(): string {
    return 'このターン、ダメージ5の攻撃カードのコスト-1'
  }
}

