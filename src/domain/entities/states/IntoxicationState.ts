import { State } from '../State'
import { StatusTypeCardTag } from '../cardTags'

export class IntoxicationState extends State {
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
    // 将来的に Action.cost で酩酊を参照し、記憶カードのコストを delta 増加させる想定。
    return `「記憶」タグのカードを使うとき、コストが${delta}増加する`
  }
}
