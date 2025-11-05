import { CardCategoryTag } from '../CardTag'

export class ArcaneCardTag extends CardCategoryTag {
  constructor() {
    super({
      id: 'tag-arcane',
      name: '魔',
      description: '傷に惹かれる者たちの力',
    })
  }
}
