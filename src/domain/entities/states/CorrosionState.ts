import { State } from '../State'
import type { DamageCalculationParams } from '../Damages'

export class CorrosionState extends State {
  constructor(magnitude = 1) {
    super({
      id: 'state-corrosion',
      name: '腐食',
      magnitude,
      cardDefinition: {
        title: '腐食',
        type: 'status',
        cost: 1,
      },
    })
  }

  override description(): string {
    const bonus = (this.magnitude ?? 0) * 10
    return `ダメージを受けるとき、+${bonus}`
  }

  override affectsDefender(): boolean {
    return true
  }

  override modifyDamage(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'defender') {
      return params
    }

    const bonus = (this.magnitude ?? 0) * 10
    return {
      ...params,
      amount: params.amount + bonus,
    }
  }
}
