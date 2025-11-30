import { Relic } from './Relic'

/**
 * 清廉な身体：状態異常解除のコストを軽減
 */
export class PureBodyRelic extends Relic {
  readonly id = 'pure-body'
  readonly name = '清廉な身体'
  readonly usageType = 'active' as const
  readonly icon = '💧'

  description(): string {
    return '起動：このターン中、状態異常を解除するカードのマナコストが1減少する。'
  }

  markUsed(): void {
    // 現状は使用済み管理が不要なためダミー実装
  }
}
