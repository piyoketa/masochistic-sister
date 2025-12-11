<!--
DevilStatueRewardView の責務:
- フィールドノード「悪魔の像」で提示される呪いカード（状態異常カード）候補を表示し、プレイヤーに指定数（現状2枚）の呪いを選ばせて獲得させる。
- 呪い選択後、デッキへカードを追加し、フィールドの該当ノードをクリア扱いにしてフィールド画面へ戻る。

責務ではないこと:
- 呪い候補の決定やフィールド構造の定義（FieldStore が担当）。
- 呪いカードの詳細説明生成（Library / CardInfoBuilder が担当）。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainGameLayout from '@/components/battle/MainGameLayout.vue'
import CardList from '@/components/CardList.vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import type { CardInfo } from '@/types/battle'
import { buildCardInfosFromBlueprints, type CardBlueprint } from '@/domain/library/Library'

const DEVIL_STATUE_CURSE_CANDIDATES: CardBlueprint[] = [
  { type: 'state-evil-thought' }, // 邪念
  { type: 'state-intoxication' }, // 酩酊
  { type: 'state-corrosion' }, // 腐食
  { type: 'state-sticky' }, // 粘液
  { type: 'state-heavyweight' }, // 重量化
]
const DEVIL_STATUE_SELECTION_COUNT = 2

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const fieldStore = useFieldStore()
const router = useRouter()

const selectionCount = computed(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isDevilStatueNode(node)) {
    return node.selectionCount
  }
  return DEVIL_STATUE_SELECTION_COUNT
})

const curses = computed<CardBlueprint[]>(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isDevilStatueNode(node)) {
    return node.curses
  }
  return DEVIL_STATUE_CURSE_CANDIDATES
})

const curseInfos = ref<CardInfo[]>([])
const selectedIds = ref<Set<string>>(new Set())
const isProcessing = ref(false)
const claimError = ref<string | null>(null)

const playerStatus = computed(() => ({
  hp: playerStore.hp,
  maxHp: playerStore.maxHp,
  deckCount: playerStore.deck.length,
}))

const canClaim = computed(
  () => selectedIds.value.size === selectionCount.value && selectionCount.value > 0 && !isProcessing.value,
)

onMounted(() => {
  curseInfos.value = buildCardInfosFromBlueprints(curses.value, 'curse-choice')
  selectedIds.value = new Set()
})

function resolveBlueprintById(id: string): CardBlueprint | null {
  const idx = curseInfos.value.findIndex((info) => info.id === id)
  if (idx < 0) {
    return null
  }
  return curses.value[idx] ?? null
}

function toggleSelect(id: string | null): void {
  if (!id) {
    return
  }
  const next = new Set(selectedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    if (next.size >= selectionCount.value) {
      // 選択上限に達している場合は何もせず終了
      selectedIds.value = next
      return
    }
    next.add(id)
  }
  selectedIds.value = next
}

function applySelection(ids: string[]): void {
  const next = new Set<string>()
  for (const id of ids) {
    if (next.size >= selectionCount.value) {
      break
    }
    next.add(id)
  }
  selectedIds.value = next
}

async function handleClaim(): Promise<void> {
  if (!canClaim.value) {
    return
  }
  isProcessing.value = true
  claimError.value = null
  try {
    selectedIds.value.forEach((id) => {
      const blueprint = resolveBlueprintById(id)
      if (blueprint) {
        playerStore.addCard(blueprint)
      }
    })
    fieldStore.markCurrentCleared()
    await router.push('/field')
  } catch (error) {
    claimError.value = error instanceof Error ? error.message : String(error)
    isProcessing.value = false
  }
}
</script>

<template>
  <MainGameLayout>
    <div class="devil-view">
      <header class="header">
        <div>
          <p class="eyebrow">悪魔の像</p>
          <h1>呪いを選択する</h1>
        </div>
        <div class="header-status">
          <span>HP: {{ playerStatus.hp }} / {{ playerStatus.maxHp }}</span>
          <span>デッキ枚数: {{ playerStatus.deckCount }}</span>
        </div>
      </header>

      <section class="card-section">
        <CardList
          v-if="curseInfos.length"
          :cards="curseInfos"
          :gap="16"
          :height="240"
          :hover-effect="true"
          :force-playable="true"
          selectable
          :selected-card-id="null"
          :selected-ids="Array.from(selectedIds)"
          selection-mode="multiple"
          @update:selected-ids="(ids) => {
            const next = Array.isArray(ids) ? ids.map(String) : []
            applySelection(next)
          }"
          @update:selected-card-id="(id) => toggleSelect((id as string) ?? null)"
        />
        <p class="card-note">
          {{ selectionCount > 0
            ? `提示された呪いの中から ${selectionCount} 枚を選んで獲得します。`
            : '呪い候補が見つかりません。' }}
        </p>
      </section>

      <footer class="actions">
        <button type="button" class="action-button" :disabled="!canClaim" @click="handleClaim">
          呪いを受け入れてフィールドへ戻る
        </button>
        <p class="action-note">※ 選択した呪いカードがデッキに追加されます。</p>
        <p v-if="claimError" class="action-error">{{ claimError }}</p>
      </footer>
    </div>
  </MainGameLayout>
</template>

<style scoped>
.devil-view {
  padding: 24px clamp(20px, 5vw, 48px);
  color: #f5f2ff;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  letter-spacing: 0.16em;
  color: rgba(245, 242, 255, 0.7);
}

.header h1 {
  margin: 0;
  letter-spacing: 0.08em;
}

.header-status {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
  color: rgba(245, 242, 255, 0.85);
}

.card-section {
  background: rgba(16, 14, 24, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px 14px 16px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

.card-note {
  margin: 8px 4px 0;
  font-size: 12px;
  color: rgba(245, 242, 255, 0.72);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.action-button {
  background: rgba(255, 227, 115, 0.95);
  color: #2d1a0f;
  border: none;
  border-radius: 12px;
  padding: 10px 18px;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 0.06em;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.35);
}

.action-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.action-button:not(:disabled):hover,
.action-button:not(:disabled):focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.45);
}

.action-note {
  margin: 0;
  font-size: 12px;
  color: rgba(245, 242, 255, 0.75);
}

.action-error {
  margin: 0;
  font-size: 12px;
  color: #ffb4c1;
}
</style>
