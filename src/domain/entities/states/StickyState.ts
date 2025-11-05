import { State } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { DamageCalculationParams } from '../Damages'

export class StickyState extends State {
  constructor(magnitude = 1) {
    super({
      id: 'state-sticky',
      name: 'ねばねば',
      magnitude,
      cardDefinition: {
        title: 'ねばねば',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
    return `連続攻撃を受けるとき、回数+${bonus}`
  }

  override modifyDamage(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'defender' || params.count <= 1) {
      return params
    }

    const bonus = this.magnitude ?? 0
    return {
      ...params,
      count: params.count + bonus,
    }
  }
}
