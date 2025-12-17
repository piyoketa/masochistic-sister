import { computed, ref, watch, type Ref } from 'vue'
import type { Battle, BattleSnapshot } from '@/domain/battle/Battle'
import type { EssentialEnemyActionHint } from '@/view/enemyActionHintsForView'
import { buildEnemyActionHintsForView } from '@/view/enemyActionHintsForView'

/*
useEnemyActionHints の責務:
- Battle 実体と表示中スナップショットを受け取り、敵行動ヒントの計算とキャッシュ管理を行う。
- 敵ターン中に行動済みの敵はキャッシュを返し、planUpdateToken 変化時にはキャッシュをクリアする。

責務ではないこと:
- コンポーネント描画やスタイルの適用。純粋にデータ生成のみ担当。
*/
export function useEnemyActionHints(params: {
  battleGetter: () => Battle | undefined
  snapshot: Ref<BattleSnapshot | undefined>
  planUpdateToken?: Ref<number>
}): { enemyActionHintsById: Ref<Map<number, EssentialEnemyActionHint[]>> } {
  const { battleGetter, snapshot, planUpdateToken } = params

  const lastEnemyActionHints = ref<Map<number, EssentialEnemyActionHint[]>>(new Map())
  if (planUpdateToken) {
    watch(
      planUpdateToken,
      () => {
        lastEnemyActionHints.value = new Map()
      },
      { flush: 'sync' },
    )
  }

  const enemyActionHintsById = computed<Map<number, EssentialEnemyActionHint[]>>(() => {
    const battle = battleGetter()
    const snap = snapshot.value
    if (!battle || !snap) {
      return new Map<number, EssentialEnemyActionHint[]>()
    }
    const map = buildEnemyActionHintsForView({
      battle,
      snapshot: snap,
      cache: lastEnemyActionHints.value,
    })
    lastEnemyActionHints.value = map
    return map
  })

  return { enemyActionHintsById }
}
