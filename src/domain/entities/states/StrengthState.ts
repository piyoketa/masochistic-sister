import { BuffState } from '../State'
import type { DamageCalculationParams } from '../Damages'

export class StrengthState extends BuffState {
  constructor(magnitude = 0) {
    super({
      id: 'state-strength',
      name: '打点上昇',
      magnitude,
    })
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
    return `与ダメージ+${bonus}`
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
      amount: params.amount + bonus,
    }
  }
}
