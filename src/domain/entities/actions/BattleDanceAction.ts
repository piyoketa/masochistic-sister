import { Skill, type ActionContext } from '../Action'
import { AccelerationState } from '../states/AccelerationState'
import type { Player } from '../Player'
import type { Enemy } from '../Enemy'

export class BattleDanceAction extends Skill {
  constructor() {
    super({
      name: '戦いの舞い',
      cardDefinition: {
        title: '戦いの舞い',
        type: 'skill',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '自身に加速(1)を付与する'
  }

  override execute(context: ActionContext): void {
    const acceleration = new AccelerationState(1)
    const source = context.source

    if (isPlayer(source)) {
      source.addState(acceleration, { battle: context.battle })
    } else {
      source.addState(acceleration)
    }
  }
}

function isPlayer(entity: Player | Enemy): entity is Player {
  return 'currentMana' in entity
}
