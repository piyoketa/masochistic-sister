import { Attack, type ActionContext } from '../Action'
import { Damages } from '../Damages'
import { StickyState } from '../states/StickyState'
import type { Player } from '../Player'
import type { Enemy } from '../Enemy'
import { isPlayerEntity } from '../typeGuards'

export class MucusShotAction extends Attack {
  constructor() {
    super({
      name: '粘液飛ばし',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single' }),
      inflictStates: [() => new StickyState(1)],
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
}
