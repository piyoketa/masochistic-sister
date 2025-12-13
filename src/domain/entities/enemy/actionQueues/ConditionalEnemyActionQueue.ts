import type { Action } from '../../Action'
import { EnemyActionQueue } from './EnemyActionQueue'

export type ConditionalQueueContext = {
  battle?: import('../../../battle/Battle').Battle
  enemy?: import('../../Enemy').Enemy
  team?: import('../../EnemyTeam').EnemyTeam
  // その他、利用側が差し込みたい情報を許容するための拡張フィールド
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface ConditionalActionPickerParams {
  actions: Action[]
  context?: ConditionalQueueContext
}

export type ConditionalActionPicker = (params: ConditionalActionPickerParams) => Action | undefined

/**
 * 条件に応じて行動を選択するキュー。
 * - pending は常に最大1件を維持し、picker が undefined を返した場合は積まない。
 * - 行動履歴は EnemyActionQueue 基底の turnActions で保持する。
 */
export class ConditionalEnemyActionQueue extends EnemyActionQueue {
  private readonly picker: ConditionalActionPicker

  constructor(picker: ConditionalActionPicker) {
    super()
    this.picker = picker
  }

  protected populate(): void {
    if (this.pending.length > 0) {
      return
    }
    const action = this.picker({
      actions: this.actions,
      context: this.context as ConditionalQueueContext | undefined,
    })
    if (action) {
      this.pending.push(action)
    }
  }
}
