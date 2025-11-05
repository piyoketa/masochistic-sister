import { CardTypeTag } from '../CardTag'

export class SingleAttackCardTag extends CardTypeTag<'attack'> {
  readonly cardType = 'attack' as const

  constructor() {
    super({
      id: 'tag-type-single-attack',
      name: '一回攻撃',
      description: '単発の攻撃カード',
    })
  }
}
