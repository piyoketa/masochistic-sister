import { CardTypeTag } from '../CardTag'

export class SkipTypeCardTag extends CardTypeTag<'skip'> {
  readonly cardType = 'skip' as const

  constructor() {
    super({
      id: 'tag-type-skip',
      name: '行動不能',
      description: '行動を行わずターンを終了する',
    })
  }
}
