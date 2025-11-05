import { CardTypeTag } from '../CardTag'

export class StatusTypeCardTag extends CardTypeTag<'status'> {
  readonly cardType = 'status' as const

  constructor() {
    super({
      id: 'tag-type-status',
      name: '状態異常',
      description: '「使用」することで治癒できる',
    })
  }
}
