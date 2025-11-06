import { CardTag } from '../CardTag'

export class DrainCardTag extends CardTag {
  constructor() {
    super({
      id: 'tag-drain',
      name: 'ドレイン',
      description: '与えたダメージ分だけ体力を回復する。',
    })
  }
}
