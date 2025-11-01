import { State } from '../State'
import type { DamageCalculationParams } from '../Damages'

export class StrengthState extends State {
  constructor(magnitude = 0) {
    super({
      id: 'state-strength',
      name: '筋力上昇',
      magnitude,
      cardDefinition: {
        title: '筋力上昇',
        type: 'status',
        cost: 1,
      },
    })
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
    return `与えるダメージを+${bonus}する`
  }

  override affectsAttacker(): boolean {
    return true
  }

  override modifyDamage(params: DamageCalculationParams): DamageCalculationParams {
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
