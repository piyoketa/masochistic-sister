/*
stateReviver.ts の責務:
- BattleSnapshot に含まれる StateSnapshot を確実に State インスタンスへ復元し、ビュー用の計算が安全に行える土台を提供する。
- スナップショット欠落時や復元失敗時のエラー文言を統一し、デバッグログの散逸を防ぐ。

責務ではないこと:
- 復元後の State を用いたダメージ計算や表示整形（それらは呼び出し側のビルダーが担当）。
*/
import type { StateSnapshot } from '@/types/battle'
import type { State } from '@/domain/entities/State'
import { instantiateStateFromSnapshot } from '@/domain/entities/states'

export function reviveStatesOrThrow(snapshots: StateSnapshot[] | undefined, contextLabel: string): State[] {
  if (!snapshots) {
    throw new Error(`[EnemyActionHint] State snapshots missing for ${contextLabel}`)
  }
  const revived = snapshots
    .map((snapshot) => instantiateStateFromSnapshot(snapshot))
    .filter((state): state is State => Boolean(state))
  if (snapshots.length > 0 && revived.length === 0) {
    logReviveFailure(contextLabel, snapshots)
    const snapshotIds = snapshots.map((s) => s.id ?? 'undefined').join(', ')
    throw new Error(
      `[EnemyActionHint] No states could be revived from snapshots for ${contextLabel}. ids=[${snapshotIds}]`,
    )
  }
  return revived
}

function logReviveFailure(contextLabel: string, snapshots: StateSnapshot[]): void {
  // デバッグ用: どのスナップショットが復元できなかったかを明示する
  // eslint-disable-next-line no-console
  console.error('[EnemyActionHint] reviveStates failed', { contextLabel, snapshots })
}
