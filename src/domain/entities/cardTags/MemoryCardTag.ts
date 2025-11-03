import { CardTag } from '../CardTag'

export class MemoryCardTag extends CardTag {
  constructor() {
    super({
      id: 'tag-memory',
      name: '記憶',
      description: '被虐の記憶から作られたカード',
    })
  }
}
