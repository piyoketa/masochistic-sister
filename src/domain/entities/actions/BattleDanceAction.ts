import { Skill } from '../Action'
import { AccelerationState } from '../states/AccelerationState'

export class BattleDanceAction extends Skill {
  constructor() {
    super({
      name: '戦いの舞い',
      cardDefinition: {
        title: '戦いの舞い',
        type: 'skill',
        cost: 1,
      },
      gainStates: [() => new AccelerationState(1)],
    })
  }

  protected override description(): string {
    return '自身に加速(1)を付与する'
  }
}
