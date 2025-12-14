/*
LifeChainAction.ts の責務:
- 敵単体に状態異常「ダメージ連動」を付与するシンプルなスキルカードを表現する。
- 付与自体は Skill 基底の inflictStates に委譲し、プレイヤーが指定した敵へ一時的なリンク効果を与える。

責務ではないこと:
- ダメージ計算や追加効果の同期処理（実際のリンクダメージは Battle.handlePlayerDamageReactions が担当）。
- ターゲット選択 UI やアニメーション生成の詳細制御。

主要な通信相手とインターフェース:
- Skill 基底: inflictStates 経由で `DamageLinkState` を生成し、ターゲットに付与する。
- DamageLinkState: 付与された敵が次のターン開始時に自壊し、プレイヤー被弾時のダメージ同期トリガーとして利用される。
*/
import { Skill } from '../Action'
import {
  EnemySingleTargetCardTag,
  ExhaustCardTag,
  SacredCardTag,
  SkillTypeCardTag,
} from '../cardTags'
import { DamageLinkState } from '../states/DamageLinkState'
import { TargetEnemyOperation, type Operation } from '../operations'

export class LifeChainAction extends Skill {
  constructor() {
    super({
      name: '命の鎖',
      cardDefinition: {
        title: '命の鎖',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
        subtitle: '祈り',
        effectTags: [new ExhaustCardTag()],
        categoryTags: [new SacredCardTag()],
      },
      inflictStates: [() => new DamageLinkState()],
    })
  }

  protected override buildOperations(): Operation[] {
    return [
      new TargetEnemyOperation(),
    ]
  }

  protected override description(): string {
    return '敵単体にダメージ連動を付与する（ターン開始で消滅）'
  }
}
