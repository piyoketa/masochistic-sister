import { BuffState } from '../State'
import type { DamageCalculationParams } from '../Damages'
import type { Player } from '../Player'
import type { Enemy } from '../Enemy'

// 溜め: 次の攻撃ダメージを加算し、攻撃後に自壊する一時バフ
export class ChargeState extends BuffState {
  constructor(magnitude = 0) {
    super({
      id: 'state-charge',
      name: '溜め',
      stackable: true,
      magnitude,
    })
  }

  override get priority(): number {
    // 攻撃者側の加減算系 (Acceleration/Strength と同列)
    return 10
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
    return `次の攻撃ダメージ+${bonus}`
  }

  override affectsAttacker(): boolean {
    return true
  }

  override isPreHitModifier(): boolean {
    return true
  }

  override modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'attacker') {
      return params
    }
    const bonus = Math.max(0, Math.floor(this.magnitude ?? 0))
    return {
      ...params,
      amount: params.amount + bonus,
    }
  }

  override onActionResolved(context: { battle: any; owner: Player | Enemy; actor: Player | Enemy; action: any }): void {
    // 自身の持ち主が攻撃を行った直後に消滅
    if (context.actor !== context.owner) {
      return
    }
    if (context.action.type !== 'attack') {
      return
    }
    this.removeFromOwner(context.owner)
  }

  private removeFromOwner(owner: Player | Enemy): void {
    if ('removeState' in owner && typeof owner.removeState === 'function') {
      owner.removeState(this.id)
    }
  }
}
