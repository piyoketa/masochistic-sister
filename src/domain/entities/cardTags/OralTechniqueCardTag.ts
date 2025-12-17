/*
OralTechniqueCardTag.ts の責務:
- 「口技」カテゴリタグを定義し、口づけ系の攻撃カードを他カテゴリと区別できるようにする。
- カード定義や表示用情報へタグを付与するための値オブジェクトを提供する。

責務ではないこと:
- 具体的な打点補正や効果発火のロジック（State や Relic 側で行う）。
- 対象指定や種別タグのようなカードの基本挙動の決定。

主要な通信相手とインターフェース:
- `CardDefinition`: `categoryTags` に挿入され、表示・条件判定に利用される。
- `GlossyLipsState`: `categoryTags` をチェックして口技のみ打点を上乗せする際に、このタグの `id` を参照する。
*/
import { CardCategoryTag } from '../CardTag'

export class OralTechniqueCardTag extends CardCategoryTag {
  constructor() {
    super({
      id: 'tag-oral-technique',
      name: '口技',
      description: '口づけなど口を用いた技',
    })
  }
}
