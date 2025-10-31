import { CardTag } from '../CardTag'

export class ExhaustCardTag extends CardTag {
  constructor() {
    super({
      id: 'tag-exhaust',
      name: '消費',
      description: '使用すると、この戦闘中は除外される',
    })
  }
}
