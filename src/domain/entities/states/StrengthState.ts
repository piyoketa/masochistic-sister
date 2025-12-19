import { BuffState } from '../State'
import type { DamageCalculationParams } from '../Damages'

export class StrengthState extends BuffState {
  constructor(magnitude = 0) {
    super({
      id: 'state-strength',
      name: '打点上昇',
      stackable: true,
      magnitude,
    })
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
    return `攻撃時、打点+<magnitude>${bonus}</magnitude>`
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

  override get priority(): number {
    return 10
  }
}
