import { CardEffectTag } from './CardEffectTag'

export class DrainCardTag extends CardEffectTag {
  constructor() {
    super({
      id: 'tag-drain',
      name: 'ドレイン',
      description: '与えたダメージ分だけ体力を回復する。',
      iconPath: '/assets/icons/drain.png',
    })
  }
}
