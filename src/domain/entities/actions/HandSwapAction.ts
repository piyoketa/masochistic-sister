import { Skill, type ActionContext } from '../Action'
import { SelectHandCardOperation } from '../operations'
import { SelfTargetCardTag, SkillTypeCardTag } from '../cardTags'
import type { Operation } from '../operations'

export class HandSwapAction extends Skill {
  constructor() {
    super({
      name: '手札入れ替え',
      cardDefinition: {
        title: '手札入れ替え',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '手札を1枚捨て、新たに1枚ドローする'
  }

  protected override buildOperations(): Operation[] {
    return [new SelectHandCardOperation()]
  }

  protected override perform(context: ActionContext): void {
    const selectOperation = context.operations?.find(
      (operation) => operation.type === SelectHandCardOperation.TYPE,
    ) as SelectHandCardOperation | undefined

    if (!selectOperation) {
      throw new Error('SelectHandCardOperation is required for Hand Swap')
    }

    const selectedCard = selectOperation.card
    context.battle.hand.remove(selectedCard)
    context.battle.discardPile.add(selectedCard)
    context.battle.drawForPlayer(1)
  }
}
