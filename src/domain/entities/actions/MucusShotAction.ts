import { Attack, type ActionContext } from '../Action'
import { Damages } from '../Damages'
import type { Player } from '../Player'
import type { Enemy } from '../Enemy'
import { StickyState } from '../states/StickyState'
import { isPlayerEntity } from '../typeGuards'
export class MucusShotAction extends Attack {
  constructor() {
    super({
      name: '粘液飛ばし',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single' }),
      cardDefinition: {
        title: '粘液飛ばし',
        type: 'attack',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '粘液を浴びせ、対象に粘着ダメージを与える'
  }

  protected override onAfterDamage(
    context: ActionContext,
    _damages: Damages,
    defender: Player | Enemy,
  ): void {
    if (isPlayerEntity(context.source) && !isPlayerEntity(defender)) {
      defender.addState(new StickyState(1))
    }
  }
}
