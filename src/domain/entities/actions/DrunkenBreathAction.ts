import { Skill } from '../Action/Skill'
import { IntoxicationState } from '../states/IntoxicationState'
import { EnemySingleTargetCardTag, SkillTypeCardTag } from '../cardTags'

/**
 * 酒の息:
 * 対象に酩酊を付与するだけのスキル。ダメージは与えない。
 */
export class DrunkenBreathAction extends Skill {
  static readonly cardId = 'drunken-breath'
  constructor(magnitude = 1) {
    super({
      name: '酒の息',
      cardDefinition: {
        title: '酒の息',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
        subtitle: '',
      },
      inflictStates: [() => new IntoxicationState(magnitude)],
    })
  }

  protected override description(): string {
    return '対象に酩酊を付与する'
  }
}
