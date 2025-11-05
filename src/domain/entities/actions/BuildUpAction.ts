import { Skill } from '../Action'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'
import { StrengthState } from '../states/StrengthState'

export class BuildUpAction extends Skill {
  constructor() {
    super({
      name: 'ビルドアップ',
      cardDefinition: {
        title: 'ビルドアップ',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
      },
      gainStates: [() => new StrengthState(10)],
    })
  }

  protected override description(): string {
    return '筋力上昇し、次のターンからの攻撃力を高める'
  }
}
