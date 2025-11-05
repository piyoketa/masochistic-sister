import { State } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { DamageCalculationParams } from '../Damages'

export class AccelerationState extends State {
  constructor(magnitude = 1) {
    super({
      id: 'state-acceleration',
      name: '加速',
      magnitude,
      cardDefinition: {
        title: '加速',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
    return `攻撃回数を+${bonus}する`
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
      count: params.count + bonus,
    }
  }
}
