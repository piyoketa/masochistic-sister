/*
神の寵愛 (MemorySaintRelic) の責務:
- フィールド型レリック「神の寵愛」を定義し、表示名/アイコン/説明文を提供する。

責務ではないこと:
- 回復効果の発火タイミング管理や数値計算の実行。これはバトル終了時の処理フローが担う。
- 所持管理や永続化。playerStore などの上位レイヤーに委譲する。
*/
import { Relic, type RelicDescriptionContext, type RelicUsageType } from './Relic'

export class MemorySaintRelic extends Relic {
  readonly id = 'memory-saint-relic'
  readonly name = '神の寵愛'
  readonly usageType: RelicUsageType = 'field'
  readonly icon = '🕯️'

  override description(context?: RelicDescriptionContext): string {
    // 最大HPが取得できる場合は 1/3 を即時計算し、ツールチップでも現在値を反映する。
    const maxHp = context?.player?.maxHp ?? context?.playerSnapshot?.maxHp
    const healAmount = maxHp !== undefined ? Math.floor(maxHp / 3) : 50
    return `戦闘終了時、HPを<variable>${healAmount}</variable>回復する\n\n（最大HPの1/3回復する）`
  }
}
