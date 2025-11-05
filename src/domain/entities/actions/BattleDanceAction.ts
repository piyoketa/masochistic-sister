import { Skill } from '../Action'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'
import { AccelerationState } from '../states/AccelerationState'

export class BattleDanceAction extends Skill {
  constructor() {
    super({
      name: '戦いの舞い',
      cardDefinition: {
        title: '戦いの舞い',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
      },
      gainStates: [() => new AccelerationState(1)],
    })
  }

  protected override description(): string {
    return '加速し、次のターンから攻撃回数を増やす'
  }
}
