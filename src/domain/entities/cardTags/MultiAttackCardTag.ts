import { CardTypeTag } from '../CardTag'

export class MultiAttackCardTag extends CardTypeTag<'attack'> {
  readonly cardType = 'attack' as const

  constructor() {
    super({
      id: 'tag-type-multi-attack',
      name: '連続攻撃',
      description: '複数回の攻撃カード',
    })
  }
}
