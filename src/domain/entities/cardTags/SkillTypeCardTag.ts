import { CardTypeTag } from '../CardTag'

export class SkillTypeCardTag extends CardTypeTag<'skill'> {
  readonly cardType = 'skill' as const

  constructor() {
    super({
      id: 'tag-type-skill',
      name: 'スキル',
      description: '技を発動するカード',
    })
  }
}
