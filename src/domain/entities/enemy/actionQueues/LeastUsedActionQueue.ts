/*
LeastUsedActionQueue の責務:
- 使用条件を満たす行動だけを候補にし、戦闘中の選択回数が最も少ない行動を優先して選ぶ。
- 選択回数が同じ場合は RNG でランダムに選択する。
- 行動がキューに積まれたタイミングでカウントを進め、後で置き換えられてもカウントは巻き戻さない。

責務ではないこと:
- 行動の詳細な実行や効果。ここでは選択と計画のみを扱う。
- 行動の置き換えによるカウント減算（仕様として行わない）。
*/
import type { Action } from '../../Action/ActionBase'
import type { Battle } from '@/domain/battle/Battle'
import type { Enemy } from '../../Enemy'
import type { EnemyTeam } from '../../EnemyTeam'
import { EnemyActionQueue } from './EnemyActionQueue'

export class LeastUsedActionQueue extends EnemyActionQueue {
  private readonly usageCount = new Map<Action, number>()

  protected pickActionForTurn(_turn: number): Action | undefined {
    const battle = (this.context as any)?.battle as Battle | undefined
    const enemy = ((this.context as any)?.enemy ?? (this.context as any)?.owner) as Enemy | undefined
    const team = (this.context as any)?.team as EnemyTeam | undefined
    const usable = this.actions.filter((action) => {
      if (typeof action.canUse !== 'function') {
        return true
      }
      if (!battle || !enemy) {
        return action.canUse({ battle: undefined as any, source: undefined as any })
      }
      return action.canUse({ battle, source: enemy })
    })
    if (usable.length === 0) {
      return undefined
    }
    const minUsage = usable.reduce((min, action) => Math.min(min, this.usageCount.get(action) ?? 0), Infinity)
    const leastUsed = usable.filter((action) => (this.usageCount.get(action) ?? 0) === minUsage)
    const index = Math.floor(this.rng() * leastUsed.length)
    return leastUsed[Math.min(index, leastUsed.length - 1)]
  }

  protected override assignActionForTurn(
    turn: number,
    action: Action,
    options?: { replace?: boolean; plan?: import('../../Action/ActionBase').ActionPlanSnapshot },
  ): void {
    super.assignActionForTurn(turn, action, options)
    // キューに積んだ時点でカウントを増やす。置き換えでも減算しない。
    const current = this.usageCount.get(action) ?? 0
    this.usageCount.set(action, current + 1)
  }
}
