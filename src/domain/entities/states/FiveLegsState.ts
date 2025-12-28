import type { Battle } from '../../battle/Battle'
import type { Player } from '../Player'
import type { Enemy } from '../Enemy'
import { TraitState } from '../State'
import { StunCountState } from './StunCountState'

export class FiveLegsState extends TraitState {
  constructor(magnitude = 5) {
    super({
      id: 'trait-five-legs',
      name: 'スタンカウント回復',
      stackable: true,
      magnitude,
      isImportant: true,
    })
  }

  override description(): string {
    const requirement = this.magnitude ?? 5
    return `毎ターン開始時、スタンカウントを<magnitude>${requirement}</magnitude>点に回復する`
  }

  override onTurnStart(context: { battle: Battle; owner: Player | Enemy }): void {
    const { battle, owner } = context
    // スタン閾値は magnitude で管理し、スタン発生ごとに累積して難度を上げる。
    const requirement = Math.max(5, Math.floor(this.magnitude ?? 5))
    owner.removeState('state-stun-count')
    owner.addState(new StunCountState(requirement), { battle })
  }

  increaseRequirement(delta = 5): void {
    const current = Math.max(5, Math.floor(this.magnitude ?? 5))
    const increment = Math.max(0, Math.floor(delta))
    this.setMagnitude(current + increment)
  }
}
