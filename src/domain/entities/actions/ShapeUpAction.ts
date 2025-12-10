/*
ShapeUpAction.ts の責務:
- 単体に5ダメージを与えつつ、対象へ非スタックの[軽量化]を1付与する攻撃アクションを提供する。
- カード定義（タイトル/タグ/コスト/ターゲット）を保持し、敵や記憶カード生成時に一貫したメタ情報を渡す。

責務ではないこと:
- 付与先の選択やターン制御（行動順の管理は EnemyActionQueue や Battle が行う）。
- 軽量化の具体的な効果量や非スタック挙動の実装（`LightweightState` 側が担う）。

主要な通信相手:
- `Attack.execute`: 基底クラスの実行フローを通じ、ダメージ計算/状態付与を行う。
- `LightweightState`: 命中時に `inflictStates` 経由でインスタンスを生成し、防御側へ付与する。
- `Damages`: 基礎ダメージプロファイル（5ダメージ・単発・cardId: shape-up）を生成し、メモリカード化にも利用される。
*/
import { Attack } from '../Action'
import { Damages } from '../Damages'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '../cardTags'
import { LightweightState } from '../states/LightweightState'

export class ShapeUpAction extends Attack {
  constructor() {
    super({
      name: 'シェイプアップ',
      baseDamage: new Damages({
        baseAmount: 5,
        baseCount: 1,
        type: 'single',
        cardId: 'shape-up',
      }),
      effectType: 'impact',
      inflictStates: [() => new LightweightState()],
      cardDefinition: {
        title: 'シェイプアップ',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '単体に5ダメージし、[軽量化]1を付与する（累積なし）'
  }
}
