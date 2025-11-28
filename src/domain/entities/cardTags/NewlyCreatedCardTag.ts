import { CardCategoryTag } from '../CardTag'

/**
 * 新規生成されたカードを示すカテゴリタグ。
 */
export class NewlyCreatedCardTag extends CardCategoryTag {
  constructor() {
    super({
      id: 'tag-newly-created',
      name: '新規',
      description: 'この戦闘で生成された新規カード',
    })
  }
}
