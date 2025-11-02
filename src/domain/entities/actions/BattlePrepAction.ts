import { Skill, type ActionContext } from '../Action'

export class BattlePrepAction extends Skill {
  constructor() {
    super({
      name: '戦いの準備',
      cardDefinition: {
        title: '戦いの準備',
        type: 'skill',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '次のターンに獲得するマナを+1する'
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
