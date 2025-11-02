import { CardTag } from '../CardTag'

export class MemoryCardTag extends CardTag {
  constructor() {
    super({
      id: 'tag-memory',
      name: '記憶',
      description: '傷の記憶から作られたカード。戦闘終了後に１枚だけデッキに入れられる',
    })
  }
}
