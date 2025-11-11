import { State } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { DamageCalculationParams } from '../Damages'

export class HardShellState extends State {
  constructor(magnitude = 20) {
    super({
      id: 'state-hard-shell',
      name: '防御',
      magnitude,
      cardDefinition: {
        title: '防御',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    const reduction = this.magnitude ?? 0
    return `被ダメージ-${reduction}`
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

    const reduction = this.magnitude ?? 0
    return {
      ...params,
      amount: params.amount - reduction,
    }
  }
}
