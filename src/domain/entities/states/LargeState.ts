import { State } from '../State'
import { StatusTypeCardTag } from '../cardTags'

export class LargeState extends State {
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
}
