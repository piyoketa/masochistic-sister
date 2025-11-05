import { Enemy } from '../Enemy'
import { State } from '../State'
import type { Battle } from '../../battle/Battle'
import type { Player } from '../Player'
import type { Action } from '../Action'

interface ActionResolvedContext {
  battle: Battle
  owner: Player | Enemy
  actor: Player | Enemy
  action: Action
}

export class CowardTrait extends State {
  constructor() {
    super({
      id: 'trait-coward',
      name: '臆病',
    })
  }

  override description(): string {
    return '最後の一人になると逃走する'
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
    if (activeEnemies.length === 1 && activeEnemies[0] === owner) {
      owner.flee(context.battle)
    }
  }
}
