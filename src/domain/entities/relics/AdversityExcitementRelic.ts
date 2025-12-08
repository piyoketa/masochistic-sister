import { Relic } from './Relic'
import { StrengthState } from '../states/StrengthState'
import type { Battle } from '@/domain/battle/Battle'
import type { Player } from '../Player'

/**
 * 逆境：手札状態異常を分析し打点上昇
 */
export class AdversityExcitementRelic extends Relic {
  readonly id = 'adversity-excitement'
  readonly name = '逆境'
  readonly usageType = 'passive' as const
  readonly icon = '🔥'

  description(): string {
    return '自身の状態異常カード枚数×2の打点上昇'
  }

  override isActive(context?: { battle?: Battle; player?: Player }): boolean {
    if (context?.player) {
      return context.player.countBaseStatusStates() > 0
    }
    return false
  }

  override getAdditionalStates(context?: { battle?: Battle; player?: Player }) {
    const player = context?.player
    if (!player) {
      return []
    }
    const statusCount = player.countBaseStatusStates()
    if (statusCount <= 0) {
      return []
    }
    // 手札状態異常1枚につき打点+2
    return [new StrengthState(statusCount * 2)]
  }
}
