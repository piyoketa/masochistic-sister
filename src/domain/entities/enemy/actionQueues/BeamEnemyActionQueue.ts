import type { Action } from '../../Action'
import { EnemyActionQueue } from './EnemyActionQueue'

/**
 * BeamEnemyActionQueue
 * --------------------
 * 2ターンのチャージ行動を挟み、3ターン目に大技を放つ行動パターン。
 * チャージ中に行動が遮られた場合は再びチャージ1からやり直す。
 * actions 配列は [charge1, charge2, beam] の順で提供される前提。
 */
export class BeamEnemyActionQueue extends EnemyActionQueue {
  private stage = 0

  protected override onInitialize(): void {
    if (this.actions.length < 3) {
      throw new Error('BeamEnemyActionQueue requires at least three actions (charge1, charge2, beam)')
    }
    this.stage = 0
    super.onInitialize()
  }

  protected populate(): void {
    if (this.pending.length > 0) {
      return
    }

    const step = Math.min(this.stage, this.actions.length - 1)
    const action = this.actions[step]
    if (action) {
      this.pending.push(action)
    }
  }

  override next(): Action | undefined {
    const action = super.next()
    if (!action) {
      return undefined
    }

    const index = this.actions.indexOf(action)
    if (index === -1) {
      // 即時挿入されたアクション。チャージ状態は保持。
      return action
    }

    if (index < 2) {
      this.stage = index + 1
    } else {
      // ビーム発射後にチャージをリセット
      this.stage = 0
    }

    return action
  }

  override discardNext(): Action | undefined {
    const action = super.discardNext()
    if (!action) {
      return undefined
    }

    const index = this.actions.indexOf(action)
    if (index !== -1 && index < 2) {
      // チャージ中に遮られた場合はチャージやり直し
      this.stage = 0
    }

    return action
  }

  override resetTurn(): void {
    // チャージ状態はターンまたぎで維持するため何もしない
  }
}
