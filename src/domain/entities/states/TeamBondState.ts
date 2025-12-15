import type { Battle } from '../../battle/Battle'
import type { Enemy } from '../Enemy'
import type { Player } from '../Player'
import { TraitState } from '../State'
import { StrengthState } from './StrengthState'

/**
 * チームの絆:
 * - 所持している敵が撃破されたとき、他の味方全員に打点上昇(10)を付与する。
 * - Traitカテゴリなのでカード化はしない。
 */
export class TeamBondState extends TraitState {
  constructor() {
    super({
      id: 'trait-team-bond',
      name: 'チームの絆',
      stackable: false,
    })
  }

  override description(): string {
    return '撃破時、他の味方全員に打点上昇(10)を付与'
  }

  override onOwnerDefeated(context: { battle: Battle; owner: Player | Enemy }): void {
    const { battle, owner } = context
    // 敵以外には付与しない
    if (!('enemyTeam' in battle)) {
      return
    }
    const enemies = battle.enemyTeam.members
    for (const ally of enemies) {
      if (ally === owner || !ally.isActive()) {
        continue
      }
      ally.addState(new StrengthState(10), { battle })
    }
  }
}
