import { BadState } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import { StateAction } from '../Action/StateAction'
import type { CardTag } from '../CardTag'

class IntoxicationStateAction extends StateAction {
  constructor(state: IntoxicationState, tags?: CardTag[]) {
    super({
      name: state.name,
      cardDefinition: state.createCardDefinition(),
      tags,
      stateId: state.id,
      sourceState: state,
    })
  }
}

export class IntoxicationState extends BadState {
  constructor(magnitude = 1) {
    super({
      id: 'state-intoxication',
      name: '酩酊',
      magnitude,
      cardDefinition: {
        title: '酩酊',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    const delta = this.magnitude ?? 0
    return `被虐の記憶のコスト+${delta}`
  }

  override costAdjustment(context?: { cardType?: import('../CardDefinition').CardDefinition['cardType'] }): number {
    const isAttack = context?.cardType === 'attack'
    if (!isAttack) return 0
    return Math.max(0, Math.floor(this.magnitude ?? 0))
  }

  override action(tags?: CardTag[]): StateAction {
    return new IntoxicationStateAction(this, tags)
  }
}
