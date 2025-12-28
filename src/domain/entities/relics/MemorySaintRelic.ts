/*
記憶の聖女 (MemorySaintRelic) の責務:
- パッシブレリック「記憶の聖女」を定義し、表示名/アイコン/説明文を提供する。
- 戦闘終了時に「最大HPの半分を回復する」効果を表すメタ情報を返す（実際の回復処理はバトル終了ロジック側で行う前提）。

責務ではないこと:
- 回復効果の発火タイミング管理や数値計算の実行。これはバトル終了時の処理フローが担う。
- 所持管理や永続化。playerStore などの上位レイヤーに委譲する。
*/
import { Relic, type RelicUsageType } from './Relic'

export class MemorySaintRelic extends Relic {
  readonly id = 'memory-saint-relic'
  readonly name = '記憶の聖女'
  readonly usageType: RelicUsageType = 'passive'
  readonly icon = '🕯️'

  override description(): string {
    return '戦闘終了時、最大HPの1/3を回復する'
  }
}
