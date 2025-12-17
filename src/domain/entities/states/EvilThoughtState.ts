import { BadState } from '../State'
import { StatusTypeCardTag } from '../cardTags'
import { StateAction } from '../Action/StateAction'
import type { CardTag } from '../CardTag'

class EvilThoughtStateAction extends StateAction {
  constructor(state: EvilThoughtState, tags?: CardTag[]) {
    super({
      name: state.name,
      cardDefinition: state.createCardDefinition(),
      tags,
      stateId: state.id,
      sourceState: state,
    })
  }
}

// 邪念: 神聖タグのカードコスト+1（Action.cost側で参照）
export class EvilThoughtState extends BadState {
  constructor(magnitude = 1) {
    super({
      id: 'state-evil-thought',
      name: '邪念',
      stackable: true,
      magnitude,
      cardDefinition: {
        title: '邪念',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    const add = this.magnitude ?? 0
    return `神聖カードのコスト+${add}`
  }

  override costAdjustment(context?: { cardTags?: CardTag[] }): number {
    const tags = context?.cardTags ?? []
    const hasSacred = tags.some((tag) => tag.id === 'tag-sacred')
    if (!hasSacred) return 0
    return Math.max(0, Math.floor(this.magnitude ?? 0))
  }

  override action(tags?: CardTag[]): StateAction {
    return new EvilThoughtStateAction(this, tags)
  }
}
