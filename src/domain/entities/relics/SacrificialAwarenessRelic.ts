import { Relic } from './Relic'

/**
 * 贄の自覚：起動効果
 */
export class SacrificialAwarenessRelic extends Relic {
  readonly id = 'sacrificial-awareness'
  readonly name = '贄の自覚'
  readonly usageType = 'active' as const
  readonly icon = '🩸'

  description(): string {
    return '起動：自身に状態異常「贄」を付与する。1戦闘につき1回だけ使用可能。'
  }
}
