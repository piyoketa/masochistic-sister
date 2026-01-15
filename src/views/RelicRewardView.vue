<!--
RelicRewardView の責務:
- フィールドのレリック獲得マスで、候補から1つ選択して獲得し、フィールドへ戻る。
- プレイヤー状態を表示しつつ、選択完了後は1ボタンで遷移する。

非責務:
- フィールド生成・遷移管理（fieldStore に委譲）。
- レリックの効果ロジック（レリッククラスに委譲）。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainGameLayout from '@/components/battle/MainGameLayout.vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import { getRelicInfo, type RelicInfo } from '@/domain/entities/relics/relicLibrary'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import type { CardInfo } from '@/types/battle'
import RelicCard from '@/components/RelicCard.vue'

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const fieldStore = useFieldStore()
const router = useRouter()

const selectionTheme = ref<EnemySelectionTheme>('default')
const outcomes: [] = []
const states: string[] = []

const candidateRelics = computed(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isRelicRewardNode(node)) {
    return node.candidateRelics
  }
  return []
})

const drawCount = computed(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isRelicRewardNode(node)) {
    return node.drawCount
  }
  return 0
})

const drawnRelics = ref<RelicInfo[]>([])
const claimed = ref(false)
const claimError = ref<string | null>(null)
const relicLimitReached = computed(() => playerStore.relicLimitReached)

const playerStatus = computed(() => ({
  hp: playerStore.hp,
  maxHp: playerStore.maxHp,
  deckCount: playerStore.deck.length,
}))

const firstRelic = computed(() => drawnRelics.value[0] ?? null)
const canClaim = computed(
  () => Boolean(firstRelic.value) && !claimed.value && !relicLimitReached.value,
)
const canProceed = computed(
  () => !claimed.value && (canClaim.value || !firstRelic.value || relicLimitReached.value),
)
const actionLabel = computed(() =>
  canClaim.value ? '獲得してフィールドに戻る' : 'フィールドに戻る',
)
const noteText = computed(() => {
  if (relicLimitReached.value) {
    return 'レリック上限に達しているため獲得できません。フィールドに戻ります。'
  }
  return firstRelic.value ? 'このレリックを獲得し、フィールドへ戻ります。' : '獲得できるレリックがありません。'
})

onMounted(() => {
  drawnRelics.value = drawRelics(candidateRelics.value, drawCount.value)
})

function drawRelics(classNames: string[], count: number): RelicInfo[] {
  if (count <= 0 || classNames.length === 0) {
    return []
  }
  const owned = new Set(playerStore.relics)
  const pool = classNames.filter((name) => !owned.has(name))
  if (pool.length === 0) {
    return []
  }
  const results: RelicInfo[] = []
  for (let i = 0; i < count; i += 1) {
    const pick = pool[Math.floor(Math.random() * pool.length)]
    const info = pick ? getRelicInfo(pick, { playerSnapshot: { maxHp: playerStore.maxHp } }) : null
    if (info) {
      results.push(info)
    }
  }
  return results
}

async function handleClaim(): Promise<void> {
  if (claimed.value) return
  claimError.value = null
  const relic = firstRelic.value
  if (!relic || relicLimitReached.value) {
    // レリックが無い/上限到達のときは獲得せずに進行だけ進める。
    claimed.value = true
    fieldStore.markCurrentCleared()
    await router.push('/field')
    return
  }
  const result = playerStore.addRelic(relic.className)
  if (!result.success) {
    claimError.value = result.message
    return
  }
  claimed.value = true
  fieldStore.markCurrentCleared()
  await router.push('/field')
}

const relicCardInfos = computed<CardInfo[]>(() =>
  firstRelic.value
    ? [
        {
          id: firstRelic.value.className ?? 'relic-card',
          type: 'status',
          cost: 0,
          title: firstRelic.value.name,
          primaryTags: [],
          categoryTags: [],
          affordable: true,
          disabled: false,
          description: firstRelic.value.description,
          descriptionSegments: [{ text: firstRelic.value.description }],
        },
      ]
    : [],
)
</script>

<template>
  <MainGameLayout>
  <div class="relic-reward-view">
      <header class="header">
        <h1>レリック獲得</h1>
        <div class="header-status">
          <span>HP: {{ playerStatus.hp }} / {{ playerStatus.maxHp }}</span>
          <span>デッキ枚数: {{ playerStatus.deckCount }}</span>
        </div>
      </header>

      <div class="layout">
        <main class="main">
          <div v-if="firstRelic" class="relic-card-wrapper">
            <RelicCard :icon="firstRelic.icon" :name="firstRelic.name" :description="firstRelic.description" />
          </div>
          <p class="card-note">
            {{ noteText }}
          </p>
          <div class="actions">
            <button
              type="button"
              class="action-button"
              :disabled="!canProceed"
              @click="handleClaim"
            >
              {{ actionLabel }}
            </button>
            <p v-if="claimError" class="action-error">{{ claimError }}</p>
          </div>
        </main>
      </div>
    </div>
  </MainGameLayout>
</template>

<style scoped>
.relic-reward-view {
  padding: 24px clamp(20px, 5vw, 64px);
  background: radial-gradient(circle at top, rgba(34, 28, 63, 0.95), rgba(9, 9, 14, 0.95));
  color: #f5f2ff;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.header h1 {
  margin: 0;
  letter-spacing: 0.1em;
}

.header-status {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 14px;
  color: rgba(245, 242, 255, 0.85);
}

.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.main {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.relic-card-wrapper {
  max-width: 360px;
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

.action-error {
  margin: 0;
  font-size: 12px;
  color: #ffb4c1;
}
</style>
