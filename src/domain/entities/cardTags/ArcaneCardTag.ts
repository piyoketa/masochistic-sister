import { CardCategoryTag } from '../CardTag'

export class ArcaneCardTag extends CardCategoryTag {
  constructor() {
    super({
      id: 'tag-arcane',
      name: '魔',
      description: '痛みと傷に惹かれるモノたちの力',
    })
  }
}
