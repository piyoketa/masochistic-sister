/*
Skill.ts の責務:
- 行動種別「スキル」の共通クラスを提供し、`Action` 基底クラスに対して種別識別を追加する。
- スキル固有の追加ロジックは派生クラスに委ねつつ、最低限の構築手順だけを保証する。

責務ではないこと:
- コスト計算や効果適用など、個々のスキルごとのビジネスロジック。
- ビュー表示向けのタグ付けやアニメーション制御。

主要な通信相手とインターフェース:
- `ActionBase.ts` の `Action` クラス: 継承して `type` を `'skill'` に固定し、その他の機能はすべて親へ委譲する。
- `BaseActionProps`: 親クラスへ渡す初期化引数を流用し、スキル固有の追加プロパティは持たない（`SkillProps` は現在のところ `BaseActionProps` そのもの）。
*/
import type { BaseActionProps } from './ActionBase'
import { Action } from './ActionBase'

export interface SkillProps extends BaseActionProps {}

export abstract class Skill extends Action {
  protected constructor(props: SkillProps) {
    super(props)
  }

  get type(): 'skill' {
    return 'skill'
  }
}
