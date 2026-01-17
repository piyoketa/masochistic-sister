import { computed, type Ref } from 'vue'
import type { Battle, BattleSnapshot } from '@/domain/battle/Battle'
import type { EssentialEnemyActionHint } from '@/view/enemyActionHintsForView'
import { buildEnemyActionHintsForView } from '@/view/enemyActionHintsForView'

/*
useEnemyActionHints の責務:
- Battle 実体と表示中スナップショットを受け取り、敵行動ヒントの計算とキャッシュ管理を行う。
- 敵ターン中に行動済みの敵はキャッシュを返し、planUpdateToken 変化時にはキャッシュをクリアする。
- 敵行動中だけ「行動開始時のプレイヤー状態異常」を使う例外表示にも対応する。

責務ではないこと:
- コンポーネント描画やスタイルの適用。純粋にデータ生成のみ担当。
*/
export function useEnemyActionHints(params: {
  battleGetter: () => Battle | undefined
  snapshot: Ref<BattleSnapshot | undefined>
  actingEnemyId?: Ref<number | null>
  playerStatesAtActionStart?: Ref<BattleSnapshot['player']['states'] | null | undefined>
}): { enemyActionHintsById: Ref<Map<number, EssentialEnemyActionHint[]>> } {
  const { battleGetter, snapshot } = params

  const enemyActionHintsById = computed<Map<number, EssentialEnemyActionHint[]>>(() => {
    const battle = battleGetter()
    const snap = snapshot.value
    if (!battle || !snap) {
      return new Map<number, EssentialEnemyActionHint[]>()
    }
    const actingEnemyId = params.actingEnemyId?.value ?? null
    const playerStatesAtActionStart = params.playerStatesAtActionStart?.value ?? undefined
    return buildEnemyActionHintsForView({
      battle,
      snapshot: snap,
      actingEnemyId,
      playerStatesAtActionStart: playerStatesAtActionStart ?? undefined,
    })
  })

  return { enemyActionHintsById }
}
