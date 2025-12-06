import { Skill, type ActionContext } from '../Action'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'

export class BattlePrepAction extends Skill {
  constructor() {
    super({
      name: '戦いの準備',
      cardDefinition: {
        title: '戦いの準備',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
        subtitle: '',
      },
    })
  }

  protected override description(): string {
    return '次のターン開始時\nマナ+1'
  }

  protected override perform(context: ActionContext): void {
    const battle = context.battle
    const scheduledTurn = battle.turn.current.turnCount + 1

    battle.enqueueEvent({
      id: battle.createEventId(),
      type: 'mana',
      payload: { amount: 1 },
      scheduledTurn,
    })
  }
}
