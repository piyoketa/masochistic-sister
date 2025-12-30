/*
HolyProtectionRelic の責務:
- フィールド型レリック「聖なる守り」を定義し、名称・アイコン・説明文を提供する。
- 効果未実装状態でも relicLibrary 経由で一覧表示や所持チェックができるよう、型と識別子を確立する。

非責務:
- デッキに「天の鎖」を追加する実処理の実装やタイミング管理（デッキ初期化やレリック取得処理側で扱う）。
- 所持管理や永続化（playerStore など上位のストアが担う）。

主な通信相手:
- `relicLibrary`: Factory 経由で生成され、UI へ表示用の説明文とアイコンを提供する。
- `Relic` 利用箇所全般: usageType を参照して適切なフェーズで効果適用フックを呼び出す前提となる。
*/
import { Relic, type RelicUsageType } from './Relic'

export class HolyProtectionRelic extends Relic {
  readonly id = 'holy-protection'
  readonly name = '聖なる守り'
  readonly usageType: RelicUsageType = 'field'
  readonly icon = '🛡️'

  description(): string {
    // 効果は未実装だが、デザイン上の期待値を説明文で先行提示する。
    return 'デッキに「天の鎖」が<magnitude>5</magnitude>枚追加される'
  }
}
