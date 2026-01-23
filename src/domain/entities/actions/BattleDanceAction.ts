import { Skill } from '../Action/Skill'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'
import { AccelerationState } from '../states/AccelerationState'

export class BattleDanceAction extends Skill {
  static readonly cardId = 'battle-dance'
  constructor() {
    super({
      name: '戦いの舞い',
      cardDefinition: {
        title: '戦いの舞い',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
        subtitle: '',
      },
      gainStates: [() => new AccelerationState(1)],
      audioCue: {
        soundId: 'skills/kurage-kosho_status03.mp3',
        waitMs: 0,
        durationMs: 0,
      },
    })
  }

  protected override description(): string {
    return '加速し、次のターンから攻撃回数を増やす'
  }
}
