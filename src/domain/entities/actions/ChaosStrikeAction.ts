import { SingleAttack, type ActionContext } from '../Action'
import type { Operation } from '../operations'
import { SelectHandCardOperation } from '../operations'
import type { Enemy } from '../Enemy'

export class ChaosStrikeAction extends SingleAttack {
  constructor() {
    super({
      name: '混迷',
      baseDamage: 0,
      description: '手札を1枚捨て、そのカードのコスト×10ダメージを与える',
      cardDefinition: {
        title: '混迷',
        type: 'attack',
        cost: 1,
        description: '手札を1枚捨て、そのカードのコスト×10ダメージを与える',
      },
    })
  }

  protected override buildOperations(): Operation[] {
    return [...super.buildOperations(), new SelectHandCardOperation()]
  }

  override execute(context: ActionContext): void {
    const selectOperation = context.operations?.find(
      (operation) => operation.type === SelectHandCardOperation.TYPE,
    ) as SelectHandCardOperation | undefined

    if (!selectOperation) {
      throw new Error('SelectHandCardOperation is required for Chaos Strike')
    }

    const selectedCard = selectOperation.card
    context.battle.hand.remove(selectedCard)
    context.battle.discardPile.add(selectedCard)

    const damage = Math.max(0, selectedCard.cost) * 10
    const target = context.target as Enemy | undefined

    if (!target) {
      throw new Error('Chaos Strike requires a target enemy')
    }

    target.takeDamage(damage)
  }
}
