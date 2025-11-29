import { Relic } from './Relic'
import { StrengthState } from '../states/StrengthState'
import type { Battle } from '@/domain/battle/Battle'
import type { Player } from '../Player'

/**
 * 逆境への興奮：手札状態異常を分析し打点上昇
 */
export class AdversityExcitementRelic extends Relic {
  readonly id = 'adversity-excitement'
  readonly name = '逆境への興奮'
  readonly usageType = 'passive' as const
  readonly icon = '🔥'
  private lastStatusCount = 0

  description(): string {
    return '自身の状態異常カード枚数×2の打点上昇'
  }

  override isActive(): boolean {
    return this.lastStatusCount > 0
  }

  override getAdditionalStates(context?: { battle?: Battle; player?: Player }) {
    const hand = context?.battle?.hand.list() ?? []
    this.lastStatusCount = hand.filter((card) => card.type === 'status').length
    if (this.lastStatusCount <= 0) {
      return []
    }
    // 手札状態異常1枚につき打点+2
    return [new StrengthState(this.lastStatusCount * 2)]
  }
}
