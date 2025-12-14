import type { Battle } from '../../battle/Battle'
import type { Player } from '../Player'
import type { Enemy } from '../Enemy'
import { TraitState } from '../State'
import { StunCountState } from './StunCountState'

/**
 * ５本脚:
 * - 各ターン開始時にスタンカウント(5)を付与する。
 */
export class FiveLegsState extends TraitState {
  constructor() {
    super({
      id: 'trait-five-legs',
      name: 'スタンカウント回復',
    })
  }

  override description(): string {
    return '毎ターン開始時、スタンカウント(5)'
  }

  override onTurnStart(context: { battle: Battle; owner: Player | Enemy }): void {
    const { battle, owner } = context
    owner.removeState('state-stun-count')
    owner.addState(new StunCountState(5), { battle })
  }
}
