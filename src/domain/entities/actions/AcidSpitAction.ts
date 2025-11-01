import { Attack, type ActionContext } from '../Action'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'
import { Damages } from '../Damages'
import { CorrosionState } from '../states/CorrosionState'
import { isPlayerEntity } from '../typeGuards'

export class AcidSpitAction extends Attack {
  constructor() {
    super({
      name: '酸を吐く',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single' }),
      cardDefinition: {
        title: '酸を吐く',
        type: 'attack',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '対象に腐食(1)を付与する'
  }

  protected override onAfterDamage(context: ActionContext, _damages: Damages, defender: Player | Enemy): void {
    if (isPlayerEntity(defender)) {
      defender.addState(new CorrosionState(), { battle: context.battle })
    } else {
      defender.addState(new CorrosionState())
    }
  }
}
