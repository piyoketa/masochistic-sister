import { CardCategoryTag } from '../CardTag'

export class MemoryCardTag extends CardCategoryTag {
  constructor() {
    super({
      id: 'tag-memory',
      name: '記憶',
      description: '被虐の記憶から作られたカード',
    })
  }
}
