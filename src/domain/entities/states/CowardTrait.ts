import { Enemy } from '../Enemy'
import { TraitState } from '../State'
import type { Battle } from '../../battle/Battle'
import type { Player } from '../Player'
import type { Action } from '../Action'

interface ActionResolvedContext {
  battle: Battle
  owner: Player | Enemy
  actor: Player | Enemy
  action: Action
}

export class CowardTrait extends TraitState {
  constructor() {
    super({
      id: 'trait-coward',
      name: '臆病',
    })
  }

  override description(): string {
    return '臆病な敵しかいない時、逃走する'
  }

  override onActionResolved(context: ActionResolvedContext): void {
    if (!(context.owner instanceof Enemy)) {
      return
    }

    const owner = context.owner
    if (!owner.isActive()) {
      return
    }

    const activeEnemies = context.battle.enemyTeam.members.filter((enemy) => enemy.isActive())
    if (activeEnemies.length === 0) {
      return
    }

    const allCoward = activeEnemies.every((enemy) =>
      enemy
        .getStates()
        .some((state) => state instanceof CowardTrait),
    )

    if (allCoward) {
      owner.flee(context.battle)
    }
  }
}
