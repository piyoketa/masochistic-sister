import { CardTargetTag } from '../CardTag'

export class SelfTargetCardTag extends CardTargetTag<'self'> {
  readonly target = 'self' as const

  constructor() {
    super({
      id: 'tag-target-self',
      name: '自身',
      description: '使用者自身に効果を及ぼすカード',
    })
  }
}
