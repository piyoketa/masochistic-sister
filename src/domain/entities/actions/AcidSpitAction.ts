import { Attack } from '../Action'
import { Damages } from '../Damages'
import { CorrosionState } from '../states/CorrosionState'

export class AcidSpitAction extends Attack {
  constructor() {
    super({
      name: '酸を吐く',
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single' }),
      inflictStates: [() => new CorrosionState()],
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
}
