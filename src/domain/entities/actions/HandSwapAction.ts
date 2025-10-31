import { Skill, type ActionContext } from '../Action'
import { SelectHandCardOperation } from '../operations'
import type { Operation } from '../operations'

export class HandSwapAction extends Skill {
  static readonly ID = 'action-hand-swap'

  constructor() {
    super({
      id: HandSwapAction.ID,
      name: '手札入れ替え',
      description: '手札を1枚捨て、1枚ドローする',
      cardDefinition: {
        title: '手札入れ替え',
        type: 'skill',
        cost: 1,
        description: '手札を1枚捨て、1枚ドローする',
      },
    })
  }

  protected override buildOperations(): Operation[] {
    return [new SelectHandCardOperation()]
  }

  override execute(context: ActionContext): void {
    const selectOperation = context.operations?.find(
      (operation) => operation.type === SelectHandCardOperation.TYPE,
    ) as SelectHandCardOperation | undefined

    if (!selectOperation) {
      throw new Error('SelectHandCardOperation is required for Hand Swap')
    }

    const selectedCard = selectOperation.card
    context.battle.hand.remove(selectedCard.id)
    context.battle.discardPile.add(selectedCard)
    context.battle.drawForPlayer(1)
  }
}
