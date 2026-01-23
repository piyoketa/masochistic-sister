/*
MiasmaAction.ts の責務:
- プレイヤー自身に状態異常「瘴気」を付与するスキルカードを表現する。
- 付与処理は Skill 基底の inflictStates を用い、瘴気の具体的なダメージ同期は State と Battle 側に委譲する。

責務ではないこと:
- 瘴気ダメージの計算・適用やアニメーション生成（MiasmaState と Battle.handlePlayerDamageReactions が担当）。
- 手札操作や追加リソース操作。

主要な通信相手とインターフェース:
- Skill 基底: gainStates 経由で `MiasmaState` を自身に付与する。
- MiasmaState: ターン開始時の自傷や、被弾時の瘴気ダメージ同期を管理する。
*/
import { Skill } from '../Action'
import { MiasmaState } from '../states/MiasmaState'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'

const DEFAULT_MAGNITUDE = 10

export class MiasmaAction extends Skill {
  static readonly cardId = 'miasma'
  constructor() {
    super({
      name: '瘴気をまとう',
      cardDefinition: {
        title: '瘴気',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
      },
      gainStates: [() => new MiasmaState(DEFAULT_MAGNITUDE)],
    })
  }

  protected override description(): string {
    return '自分に瘴気(10)を付与する'
  }
}
