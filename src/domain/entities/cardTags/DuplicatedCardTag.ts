import { CardCategoryTag } from '../CardTag'

/**
 * 複製されたカードを示すカテゴリタグ。
 * 目的: バトル中に生成された複製カードを識別し、[新規]タグとは別に区別できるようにする。
 */
export class DuplicatedCardTag extends CardCategoryTag {
  constructor() {
    super({
      id: 'tag-duplicated',
      name: '複製',
      description: 'この戦闘中に複製されたカード',
    })
  }
}
