<!--
RelicRewardView の責務:
- フィールドのレリック獲得マスに入った際、候補リストから指定数（現状1）を抽選し、プレイヤーが1つ選んで獲得できる画面を提供する。
- プレイヤーの基本ステータス表示と、獲得済み判定・次のマスへ進む導線を提供する。

責務ではないこと:
- フィールド遷移やバトル進行の管理。ノードのクリア状態や遷移は fieldStore に委譲する。
- レリックの詳細なロジック計算（isActive や状態付与）は各レリッククラスに任せ、本画面では表示と獲得のみを扱う。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameLayout from '@/components/GameLayout.vue'
import PlayerCardComponent from '@/components/PlayerCardComponent.vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import type { RelicInfo } from '@/domain/entities/relics/relicLibrary'
import { getRelicInfo } from '@/domain/entities/relics/relicLibrary'
import type { EnemySelectionTheme } from '@/types/selectionTheme'

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
const selectedClassName = ref<string | null>(null)
const claimed = ref(false)

const playerHp = computed(() => ({
  current: playerStore.hp,
  max: playerStore.maxHp,
}))

const canClaim = computed(() => Boolean(selectedClassName.value) && !claimed.value)

onMounted(() => {
  drawnRelics.value = drawRelics(candidateRelics.value, drawCount.value)
  if (drawnRelics.value.length === 1) {
    selectedClassName.value = drawnRelics.value[0]?.className ?? null
  }
})

function drawRelics(classNames: string[], count: number): RelicInfo[] {
  if (count <= 0 || classNames.length === 0) {
    return []
  }
  const results: RelicInfo[] = []
  const pool = [...classNames]
  for (let i = 0; i < count; i += 1) {
    const pick = pool[Math.floor(Math.random() * pool.length)]
    const info = pick ? getRelicInfo(pick) : null
    if (info) {
      results.push(info)
    }
  }
  return results
}

function handleSelect(className: string): void {
  if (claimed.value) return
  selectedClassName.value = className
}

function handleClaim(): void {
  if (!selectedClassName.value || claimed.value) return
  playerStore.addRelic(selectedClassName.value)
  claimed.value = true
}

async function handleProceed(): Promise<void> {
  fieldStore.markCurrentCleared()
  await router.push('/field')
}
</script>

<template>
  <GameLayout>
    <template #window>
      <div class="relic-reward-view">
        <header class="header">
          <h1>レリック獲得</h1>
          <div class="header-status">
            <span>HP: {{ playerHp.current }} / {{ playerHp.max }}</span>
            <span>デッキ枚数: {{ playerStore.deck.length }}</span>
            <span>所持金: {{ playerStore.gold }}</span>
          </div>
        </header>

        <div class="layout">
          <aside class="player-area">
            <PlayerCardComponent
              :pre-hp="playerHp"
              :post-hp="playerHp"
              :outcomes="outcomes"
              :selection-theme="selectionTheme"
              :states="states"
              :show-hp-gauge="false"
            />
          </aside>
          <main class="main">
            <h2>獲得候補 ({{ drawnRelics.length }}個)</h2>
            <div class="relic-list">
              <label
                v-for="relic in drawnRelics"
                :key="relic.className"
                class="relic-card"
                :class="{
                  'relic-card--selected': selectedClassName === relic.className,
                  'relic-card--claimed': claimed,
                }"
              >
                <input
                  class="relic-card__radio"
                  type="radio"
                  name="relic-selection"
                  :value="relic.className"
                  :checked="selectedClassName === relic.className"
                  :disabled="claimed"
                  @change="handleSelect(relic.className)"
                />
                <div class="relic-card__icon">{{ relic.icon }}</div>
                <div class="relic-card__body">
                  <div class="relic-card__title">{{ relic.name }}</div>
                  <div class="relic-card__type">種別: {{ relic.usageType }}</div>
                  <p class="relic-card__description">{{ relic.description }}</p>
                </div>
              </label>
            </div>
            <div class="actions">
              <button type="button" class="action-button" :disabled="!canClaim" @click="handleClaim">
                獲得
              </button>
              <button
                type="button"
                class="action-button action-button--next"
                :disabled="!drawnRelics.length"
                @click="handleProceed"
              >
                次に進む
              </button>
            </div>
          </main>
        </div>
      </div>
    </template>
  </GameLayout>
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
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: flex-start;
}

.player-area {
  width: 280px;
}

.main h2 {
  margin: 0 0 12px;
}

.relic-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.relic-card {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(24, 20, 30, 0.85);
  align-items: center;
  cursor: pointer;
  transition: border-color 120ms ease, transform 120ms ease;
}

.relic-card--selected {
  border-color: rgba(255, 214, 102, 0.8);
  box-shadow: 0 8px 20px rgba(255, 214, 102, 0.2);
}

.relic-card--claimed {
  opacity: 0.7;
  cursor: default;
}

.relic-card__radio {
  margin: 0;
}

.relic-card__icon {
  font-size: 24px;
}

.relic-card__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.relic-card__title {
  font-weight: 800;
  letter-spacing: 0.08em;
}

.relic-card__type {
  font-size: 12px;
  color: rgba(245, 242, 255, 0.7);
}

.relic-card__description {
  margin: 0;
  font-size: 13px;
  color: rgba(245, 242, 255, 0.9);
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.action-button {
  background: rgba(255, 227, 115, 0.9);
  color: #2d1a0f;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-weight: 800;
  cursor: pointer;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button--next {
  background: linear-gradient(90deg, #78ffd6, #6e8bff);
  color: #0d0d1a;
}
</style>
