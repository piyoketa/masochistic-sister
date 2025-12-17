import { BuffState } from '../State'
import type { DamageCalculationParams } from '../Damages'

export class AccelerationState extends BuffState {
  constructor(magnitude = 1) {
    super({
      id: 'state-acceleration',
      name: '加速',
      stackable: true,
      magnitude,
    })
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
    return `攻撃回数+${bonus}`
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

    const bonus = this.magnitude ?? 0
    return {
      ...params,
      count: params.count + bonus,
    }
  }

  override get priority(): number {
    return 10
  }
}
