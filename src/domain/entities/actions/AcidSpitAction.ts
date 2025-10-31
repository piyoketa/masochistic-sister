import { Attack, type ActionContext } from '../Action'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'
import { Damages } from '../Damages'
import { CorrosionState } from '../states/CorrosionState'

export class AcidSpitAction extends Attack {
  constructor() {
    super({
      name: '酸を吐く',
      baseDamages: Damages.single(5),
      description: '腐食(1)を付与する',
      cardDefinition: {
        title: '酸を吐く',
        type: 'attack',
        cost: 1,
        description: '腐食(1)を付与する',
      },
    })
  }
  protected override onAfterDamage(context: ActionContext, _damages: Damages, defender: Player | Enemy): void {
    if ('currentMana' in defender) {
      defender.addState(new CorrosionState(), { battle: context.battle })
    }
  }
}
