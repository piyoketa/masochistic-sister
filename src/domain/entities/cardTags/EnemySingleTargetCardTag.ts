import { CardTargetTag } from '../CardTag'

export class EnemySingleTargetCardTag extends CardTargetTag<'enemy-single'> {
  readonly target = 'enemy-single' as const

  constructor() {
    super({
      id: 'tag-target-enemy-single',
      name: '敵一体',
      description: '敵を1体対象とする',
    })
  }
}
