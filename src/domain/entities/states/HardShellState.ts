import { State } from '../State'
import type { DamageCalculationParams } from '../Damages'

export class HardShellState extends State {
  constructor(magnitude = 20) {
    super({
      id: 'state-hard-shell',
      name: '硬い殻',
      magnitude,
      cardDefinition: {
        title: '硬い殻',
        type: 'status',
        cost: 1,
      },
    })
  }

  override description(): string {
    const reduction = this.magnitude ?? 0
    return `受けるダメージを-${reduction}する`
  }

  override affectsDefender(): boolean {
    return true
  }

  override modifyDamage(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'defender') {
      return params
    }

    const reduction = this.magnitude ?? 0
    return {
      ...params,
      amount: params.amount - reduction,
    }
  }
}
