import { BuffState } from '../State'
import type { DamageCalculationParams } from '../Damages'

export class AccelerationState extends BuffState {
  constructor(magnitude = 1) {
    super({
      id: 'state-acceleration',
      name: '加速',
      stackable: true,
      magnitude,
      icon: 'stairs-up',
    })
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
    return `攻撃回数+<magnitude>${bonus}</magnitude>`
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

    // 仕様: 「一回攻撃」カードは回数操作の影響を受けず、必ず1回攻撃のままにする。
    // 連撃（multi）のみ加速で回数を増やす。
    if (params.type === 'single') {
      return params
    }

    const bonus = this.magnitude ?? 0
    return {
      ...params,
      count: params.count + bonus,
    }
  }

  override get priority(): number {
    return 15
  }
}
