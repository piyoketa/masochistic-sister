import { Skill, type ActionContext } from '../Action'
import { StrengthState } from '../states/StrengthState'
import type { Player } from '../Player'
import type { Enemy } from '../Enemy'

export class BuildUpAction extends Skill {
  constructor() {
    super({
      name: 'ビルドアップ',
      cardDefinition: {
        title: 'ビルドアップ',
        type: 'skill',
        cost: 1,
      },
    })
  }

  protected override description(): string {
    return '自身に筋力上昇を付与する'
  }

  override execute(context: ActionContext): void {
    const source = context.source
    if (isPlayer(source)) {
      source.addState(new StrengthState(10), { battle: context.battle })
    } else {
      source.addState(new StrengthState(10))
    }
  }
}

function isPlayer(entity: Player | Enemy): entity is Player {
  return 'currentMana' in entity
}
