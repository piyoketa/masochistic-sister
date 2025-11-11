import { State } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { DamageCalculationParams } from '../Damages'

export class CorrosionState extends State {
  constructor(magnitude = 1) {
    super({
      id: 'state-corrosion',
      name: '腐食',
      magnitude,
      cardDefinition: {
        title: '腐食',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    const bonus = (this.magnitude ?? 0) * 10
    return `被ダメージ+${bonus}`
  }

  override affectsDefender(): boolean {
    return true
  }

  override isPreHitModifier(): boolean {
    return true
  }

  override modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
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
