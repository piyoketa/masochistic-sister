import { CardCategoryTag } from '../CardTag'

export class SacredCardTag extends CardCategoryTag {
  constructor() {
    super({
      id: 'tag-sacred',
      name: '神聖',
      description: '暴力を許さぬ、癒しと守りの力',
    })
  }
}
