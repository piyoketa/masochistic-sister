<!--
RandomRelicRewardView の責務:
- ランダムレリック獲得マスで、候補リストから所持済みを除外した上で最大3件を提示し、1つだけ選ばせて獲得させる。
- プレイヤー状態を併せて表示し、選択後にフィールドへ戻る導線を提供する。

非責務:
- 候補リストの決定やノード生成ロジック（Field/FieldNode が担う）。
- レリック効果の実装やバトル適用処理（各レリッククラス・バトルシーンが担う）。

主な通信相手とインターフェース:
- useFieldStore: `currentNode` から RandomRelicRewardNode を取得し、`markCurrentCleared()` で進行を記録。
- usePlayerStore: `relics` を参照して所持済みを除外し、`addRelic(relicId)` で新規レリックを獲得する（上限到達時は獲得せず進行のみ）。
- vue-router: `router.push('/field')` でフィールド画面へ復帰する。
- relicLibrary: `getRelicInfo(relicId)` で表示用の名称・説明を取得し、RelicCard へ受け渡す。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainGameLayout from '@/components/battle/MainGameLayout.vue'
import RelicCard from '@/components/RelicCard.vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import { getRelicInfo, type RelicInfo } from '@/domain/entities/relics/relicLibrary'
import type { RelicId } from '@/domain/entities/relics/relicTypes'

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const fieldStore = useFieldStore()
const router = useRouter()

const candidateRelics = computed(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isRandomRelicRewardNode(node)) {
    return node.candidateRelics
  }
  return []
})

const offerCount = computed(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isRandomRelicRewardNode(node)) {
    return node.offerCount
  }
  return 0
})

const drawnRelics = ref<RelicInfo[]>([])
const selectedRelicId = ref<RelicId | null>(null)
const isProcessing = ref(false)
const claimError = ref<string | null>(null)
const relicLimitReached = computed(() => playerStore.relicLimitReached)

const playerStatus = computed(() => ({
  hp: playerStore.hp,
  maxHp: playerStore.maxHp,
  deckCount: playerStore.deck.length,
}))

const canClaim = computed(
  () =>
    Boolean(selectedRelicId.value) &&
    !isProcessing.value &&
    drawnRelics.value.length > 0 &&
    !relicLimitReached.value,
)
const canProceed = computed(
  () =>
    !isProcessing.value &&
    (canClaim.value || drawnRelics.value.length === 0 || relicLimitReached.value),
)
const actionLabel = computed(() =>
  canClaim.value ? '獲得してフィールドに戻る' : 'フィールドに戻る',
)
const noteText = computed(() => {
  if (relicLimitReached.value) {
    return 'レリック上限に達しているため獲得できません。フィールドに戻ります。'
  }
  return drawnRelics.value.length
    ? '提示されたレリックから１つ選んで獲得します。'
    : '候補すべてを所持しているため、獲得できるレリックがありません。'
})

onMounted(() => {
  drawnRelics.value = drawRelicOptions(candidateRelics.value, playerStore.relics, offerCount.value)
  selectedRelicId.value = null
})

function drawRelicOptions(relicIds: RelicId[], owned: RelicId[], offer: number): RelicInfo[] {
  if (offer <= 0 || relicIds.length === 0) return []
  const ownedSet = new Set(owned)
  // 所持済みを除外しつつ重複を避けるために一度ユニーク化する。
  const pool = relicIds.filter((relicId, idx) => relicIds.indexOf(relicId) === idx && !ownedSet.has(relicId))
  if (pool.length === 0) {
    return []
  }
  const shuffled = shuffle(pool)
  const picks = shuffled.slice(0, Math.min(offer, shuffled.length))
  return picks
    .map((relicId) => getRelicInfo(relicId, { playerSnapshot: { maxHp: playerStore.maxHp } }))
    .filter((info): info is RelicInfo => Boolean(info))
}

function shuffle<T>(items: T[]): T[] {
  const copied = [...items]
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copied[i]
    const target = copied[j]
    if (temp === undefined || target === undefined) {
      continue
    }
    copied[i] = target
    copied[j] = temp
  }
  return copied
}

function handleSelectRelic(relicId: RelicId): void {
  selectedRelicId.value = relicId
  claimError.value = null
}

async function handleClaim(): Promise<void> {
  if (!canProceed.value || isProcessing.value) return
  isProcessing.value = true
  claimError.value = null
  if (!canClaim.value) {
    // 上限到達/候補無しのときは獲得せずに進行だけ進める。
    fieldStore.markCurrentCleared()
    await router.push('/field')
    return
  }
  const relic = drawnRelics.value.find((info) => info.id === selectedRelicId.value)
  if (!relic) {
    claimError.value = '選択したレリックを特定できませんでした'
    isProcessing.value = false
    return
  }
  // 二重獲得を防ぐため、最終チェックでも所持済みを弾く。
  if (playerStore.relics.includes(relic.id)) {
    claimError.value = 'このレリックはすでに所持しています'
    isProcessing.value = false
    return
  }

  try {
    const result = playerStore.addRelic(relic.id)
    if (!result.success) {
      claimError.value = result.message
      isProcessing.value = false
      return
    }
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
    <div class="relic-reward-view">
      <header class="header">
        <h1>レリック獲得（選択）</h1>
        <div class="header-status">
          <span>HP: {{ playerStatus.hp }} / {{ playerStatus.maxHp }}</span>
          <span>デッキ枚数: {{ playerStatus.deckCount }}</span>
        </div>
      </header>

      <section class="relic-section">
        <div v-if="drawnRelics.length" class="relic-grid">
          <button
            v-for="relic in drawnRelics"
            :key="relic.id"
            type="button"
            class="relic-option"
            :class="{ 'relic-option--selected': relic.id === selectedRelicId }"
            @click="handleSelectRelic(relic.id)"
          >
            <RelicCard :icon="relic.icon" :name="relic.name" :description="relic.description" />
          </button>
        </div>
        <div v-else class="relic-empty">獲得できるレリックがありません。</div>
        <p class="relic-note">
          {{ noteText }}
        </p>
      </section>

      <footer class="actions">
        <button type="button" class="action-button" :disabled="!canProceed" @click="handleClaim">
          {{ actionLabel }}
        </button>
        <p v-if="claimError" class="action-error">{{ claimError }}</p>
      </footer>
    </div>
  </MainGameLayout>
</template>

<style scoped>
.relic-reward-view {
  padding: 24px clamp(20px, 5vw, 48px);
  color: #f5f2ff;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.header h1 {
  margin: 0;
  letter-spacing: 0.1em;
}

.header-status {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
  color: rgba(245, 242, 255, 0.85);
}

.relic-section {
  background: rgba(16, 14, 24, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px 14px 16px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

.relic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.relic-option {
  width: 100%;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, opacity 120ms ease;
  text-align: left;
}

.relic-option--selected {
  border-color: rgba(255, 227, 115, 0.8);
  box-shadow: 0 10px 22px rgba(255, 227, 115, 0.25);
  transform: translateY(-2px);
}

.relic-option:hover:not(.relic-option--selected),
.relic-option:focus-visible:not(.relic-option--selected) {
  border-color: rgba(255, 255, 255, 0.4);
}

.relic-empty {
  padding: 20px;
  text-align: center;
  color: rgba(245, 242, 255, 0.75);
}

.relic-note {
  margin: 10px 4px 0;
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

.action-error {
  margin: 0;
  font-size: 12px;
  color: #ffb4c1;
}
</style>
