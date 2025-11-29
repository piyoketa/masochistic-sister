import { Relic } from './Relic'
import { CorrosionState, AccelerationState } from '../states'

/**
 * 軽装戦闘：手札に腐食があると加速(1)を付与
 */
export class LightweightCombatRelic extends Relic {
  readonly id = 'lightweight-combat'
  readonly name = '軽装戦闘'
  readonly usageType = 'passive' as const
  readonly icon = '🪶'

  description(): string {
    return '永続：手札に「腐食」がある間、加速(1)を得る。'
  }

  override isActive(context?: { battle?: import('@/domain/battle/Battle').Battle; player?: import('../Player').Player }): boolean {
    const baseStates = context?.player?.getBaseStates() ?? []
    return baseStates.some((state) => state instanceof CorrosionState)
  }

  override getAdditionalStates(context?: {
    battle?: import('@/domain/battle/Battle').Battle
    player?: import('../Player').Player
  }): import('../State').State[] {
    if (!context?.battle || !context?.player) {
      return []
    }
    if (!this.isActive(context)) {
      return []
    }
    // 酩酊など他の補正と同様に State で表現する。累積も考慮し magnitude=1 を返す。
    return [new AccelerationState(1)]
  }
}
