import { CardCategoryTag } from '../CardTag'

export class SacredCardTag extends CardCategoryTag {
  constructor() {
    super({
      id: 'tag-sacred',
      name: '神聖',
      description: '生命を守る力',
    })
  }
}
