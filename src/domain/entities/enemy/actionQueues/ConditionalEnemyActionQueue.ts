import type { Action } from '../../Action/ActionBase'
import { EnemyActionQueue } from './EnemyActionQueue'

export type ConditionalQueueContext = {
  battle?: import('../../../battle/Battle').Battle
  enemy?: import('../../Enemy').Enemy
  team?: import('../../EnemyTeam').EnemyTeam
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
 */
export class ConditionalEnemyActionQueue extends EnemyActionQueue {
  private readonly picker: ConditionalActionPicker

  constructor(picker: ConditionalActionPicker) {
    super()
    this.picker = picker
  }

  protected pickActionForTurn(_turn: number): Action | undefined {
    return this.picker({
      actions: this.actions,
      context: this.context as ConditionalQueueContext | undefined,
    })
  }
}
