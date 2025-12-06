import { BadState } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import type { DamageCalculationParams } from '../Damages'
import { StateAction } from '../Action/StateAction'
import type { CardTag } from '../CardTag'

class CorrosionStateAction extends StateAction {
  constructor(state: CorrosionState, tags?: CardTag[]) {
    super({
      name: state.name,
      cardDefinition: state.createCardDefinition(),
      tags,
      stateId: state.id,
      sourceState: state,
    })
  }
}

export class CorrosionState extends BadState {
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
    return `被ダメージ+${bonus}\n（累積可）`
  }

  override get priority(): number {
    return 20
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

  override action(tags?: CardTag[]): StateAction {
    return new CorrosionStateAction(this, tags)
  }
}
