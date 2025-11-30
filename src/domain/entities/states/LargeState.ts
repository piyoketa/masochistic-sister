import { TraitState } from '../State'
import { StatusTypeCardTag } from '../cardTags'

export class LargeState extends TraitState {
  constructor() {
    super({
      id: 'state-large',
      name: '大型',
      cardDefinition: {
        title: '大型',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 1,
      },
    })
  }

  override description(): string {
    return '天の鎖などの足止め効果を受けない'
  }

  override stackWith(state: State): void {
    if (state.id !== this.id) {
      super.stackWith(state)
    }
    // 同じ大型は複数付与されても効果が変わらない
  }
}
