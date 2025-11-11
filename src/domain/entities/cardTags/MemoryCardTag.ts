import { CardCategoryTag } from '../CardTag'

export class MemoryCardTag extends CardCategoryTag {
  constructor() {
    super({
      id: 'tag-memory',
      name: '記憶',
      description: '傷の記憶から作られたカード',
    })
  }
}
