/*
StrikeCardTag.ts の責務:
- 「打撃」カテゴリのカードタグを提供し、打撃系攻撃を他カテゴリと区別できるようにする。
- CardDefinition や状態異常判定に付与される分類情報として機能し、JointDamageState など「打撃」限定の効果判定を可能にする。

責務ではないこと:
- 打撃カテゴリのダメージ計算そのものや付随効果の処理（実際の補正は State 側が担う）。
- 攻撃回数や対象指定といったカードの基本挙動の決定（Type/Target タグの領域）。

主要な通信相手とインターフェース:
- `CardDefinition`: `categoryTags` に挿入され、表示や効果条件の判定に使われる。
- `JointDamageState`: `categoryTags` から本タグの `id` を参照し、打撃カテゴリかどうかを判定する。
- 既存の他カテゴリ（例: Arcane/OralTechnique）との違い: こちらは「物理的な打撃」分類のみを示し、魔法属性や口技といった属性とは独立した軸で付与される。
*/
import { CardCategoryTag } from '../CardTag'

export class StrikeCardTag extends CardCategoryTag {
  constructor() {
    super({
      id: 'tag-strike',
      name: '打撃',
      description: '拳や体重を乗せた純粋な打撃',
    })
  }
}
