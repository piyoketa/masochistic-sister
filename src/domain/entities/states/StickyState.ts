import { State } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { DamageCalculationParams } from '../Damages'

export class StickyState extends State {
  constructor(magnitude = 1) {
    super({
      id: 'state-sticky',
      name: '鈍化',
      magnitude,
      cardDefinition: {
        title: '鈍化',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
   return `被攻撃回数+${bonus}`
  }

  override isPreHitModifier(): boolean {
    return true
  }

  override modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'defender' || params.type !== 'multi' || params.count <= 1) {
      return params
    }

    const bonus = this.magnitude ?? 0
    return {
      ...params,
      count: params.count + bonus,
    }
  }
}
