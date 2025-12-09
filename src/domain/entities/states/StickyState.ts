import { BadState } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { DamageCalculationParams } from '../Damages'
import { StateAction } from '../Action/StateAction'
import type { CardTag } from '../CardTag'

class StickyStateAction extends StateAction {
  constructor(state: StickyState, tags?: CardTag[]) {
    super({
      name: state.name,
      cardDefinition: state.createCardDefinition(),
      tags,
      stateId: state.id,
      sourceState: state,
    })
  }
}

export class StickyState extends BadState {
  constructor(magnitude = 1) {
    super({
      id: 'state-sticky',
      name: '粘液',
      magnitude,
      cardDefinition: {
        title: '粘液',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    const bonus = this.magnitude ?? 0
   return `被攻撃回数+${bonus}\n（累積可）`
  }

  override get priority(): number {
    return 20
  }

  override isPreHitModifier(): boolean {
    return true
  }

  override modifyPreHit(params: DamageCalculationParams): DamageCalculationParams {
    if (params.role !== 'defender' || params.type !== 'multi') {
      return params
    }

    const bonus = this.magnitude ?? 0
    return {
      ...params,
      count: params.count + bonus,
    }
  }

  override action(tags?: CardTag[]): StateAction {
    return new StickyStateAction(this, tags)
  }
}
