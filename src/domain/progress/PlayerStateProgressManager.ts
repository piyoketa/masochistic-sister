/**
 * PlayerStateProgressManager の責務:
 * - プレイヤー立ち絵の「状態進行度」を 1〜10 の範囲で管理し、進行条件に応じて加算する。
 * - 進行度の計算ロジックを Battle から分離し、将来の追加条件（状態付与など）を受け入れやすくする。
 *
 * 責務ではないこと:
 * - UI表示やSnapshotの構築は行わない（Battle が値を取得して反映する）。
 * - 実績解除やストア永続化は行わない（Battle / Store に委譲する）。
 *
 * 主な通信相手とインターフェース:
 * - Battle: recordDamageTaken / recordStateApplied を呼び出し、戻り値で進行可否を判定する。
 *   - recordDamageTaken(totalDamage: number): 合計ダメージが閾値以上なら進行する。
 *   - recordStateApplied(state: unknown): 腐食付与時のみ進行する。
 * - Battle: exportProgressCount()/restoreCount() で現在値の取得/復元を行う。
 */
import { CorrosionState } from '../entities/states'

const MIN_STATE_PROGRESS = 1
const MAX_STATE_PROGRESS = 10
const DAMAGE_PROGRESS_THRESHOLD = 20

export class PlayerStateProgressManager {
  private progressCount: number

  constructor(initialCount = MIN_STATE_PROGRESS) {
    this.progressCount = clampProgressCount(initialCount)
  }

  getCount(): number {
    return this.progressCount
  }

  exportProgressCount(): number {
    return this.progressCount
  }

  restoreCount(count: number | undefined): void {
    this.progressCount = clampProgressCount(count ?? MIN_STATE_PROGRESS)
  }

  /**
   * ダメージ合計が閾値以上の場合にのみ進行させる。
   * 連続攻撃の回数には依存せず、合計ダメージで判定する設計。
   */
  recordDamageTaken(totalDamage: number): boolean {
    const normalized = Math.max(0, Math.floor(totalDamage))
    if (normalized < DAMAGE_PROGRESS_THRESHOLD) {
      return false
    }
    return this.advanceProgress()
  }

  /**
   * 状態付与による進行は「腐食」付与時のみ許可する。
   * magnitude によらず、付与イベント1回につき1進行とする。
   */
  recordStateApplied(state: unknown): boolean {
    if (!(state instanceof CorrosionState)) {
      return false
    }
    const magnitude = Math.max(0, Math.floor(state.magnitude ?? 0))
    if (magnitude <= 0) {
      return false
    }
    return this.advanceProgress()
  }

  private advanceProgress(): boolean {
    if (this.progressCount >= MAX_STATE_PROGRESS) {
      return false
    }
    this.progressCount = Math.min(MAX_STATE_PROGRESS, this.progressCount + 1)
    return true
  }
}

function clampProgressCount(value: number): number {
  if (!Number.isFinite(value)) {
    return MIN_STATE_PROGRESS
  }
  const rounded = Math.floor(value)
  return Math.min(MAX_STATE_PROGRESS, Math.max(MIN_STATE_PROGRESS, rounded))
}
