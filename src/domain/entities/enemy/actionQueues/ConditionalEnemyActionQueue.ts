import type { Action } from '../../Action'
import { EnemyActionQueue } from './EnemyActionQueue'
import type { Battle } from '../../../battle/Battle'
import type { Enemy } from '../../Enemy'

export interface ConditionalEntry {
  actionType: abstract new (...args: any[]) => Action
  condition: (ctx: { actions: Action[]; battle?: Battle; owner?: Enemy }) => boolean
}

/**
 * 条件付きで優先度順にアクションを選択するキュー。
 * entries の先頭から条件を判定し、最初に満たしたアクションインスタンスを返す。
 */
export class ConditionalEnemyActionQueue extends EnemyActionQueue {
  private readonly entries: ConditionalEntry[]

  constructor(entries: ConditionalEntry[]) {
    super()
    this.entries = entries
  }

  protected populate(): void {
    if (this.pending.length > 0) {
      return
    }
    const ctx = {
      actions: this.actions,
      battle: (this.context?.battle as Battle | undefined) ?? undefined,
      owner: (this.context?.owner as Enemy | undefined) ?? undefined,
    }
    for (const entry of this.entries) {
      if (!entry.condition(ctx)) continue
      const found = this.actions.find((action) => action instanceof entry.actionType)
      if (found) {
        // canPlay が存在する場合は発動可能かチェック
        const canPlayFn = (found as unknown as { canPlay?: (ctx?: { battle?: Battle; source?: Enemy }) => boolean })
          .canPlay
        const canPlay = typeof canPlayFn === 'function' ? canPlayFn({ battle: ctx.battle, source: ctx.owner }) : true
        if (canPlay) {
          this.pending.push(found)
          break
        }
      }
    }
    if (this.pending.length === 0 && this.actions.length > 0) {
      // どれも満たさない場合は先頭を返す
      this.pending.push(this.actions[0]!)
    }
  }
}
