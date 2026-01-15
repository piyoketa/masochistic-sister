<!--
FixedRelicRewardView の責務:
- 固定レリック獲得マスで、事前に決定された1つのレリックを表示し、未所持なら獲得できるようにする。
- プレイヤーのステータス表示と、フィールド復帰導線を提供する。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameLayout from '@/components/GameLayout.vue'
import PlayerCardComponent from '@/components/PlayerCardComponent.vue'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import { getRelicInfo } from '@/domain/entities/relics/relicLibrary'
import type { RelicInfo } from '@/domain/entities/relics/relicLibrary'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { renderRichText } from '@/utils/richText'

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const fieldStore = useFieldStore()
const router = useRouter()

const selectionTheme = ref<EnemySelectionTheme>('default')
const outcomes: [] = []
const states: string[] = []

const relicInfo = computed<RelicInfo | null>(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isFixedRelicRewardNode(node)) {
    return getRelicInfo(node.selectedRelic, { playerSnapshot: { maxHp: playerStore.maxHp } }) ?? null
  }
  return null
})

const claimed = ref(false)

const playerHp = computed(() => ({
  current: playerStore.hp,
  max: playerStore.maxHp,
}))

const alreadyOwned = computed(() =>
  relicInfo.value ? playerStore.relics.includes(relicInfo.value.className) : false,
)
const relicLimitReached = computed(() => playerStore.relicLimitReached)

const canClaim = computed(
  () => Boolean(relicInfo.value) && !claimed.value && !alreadyOwned.value && !relicLimitReached.value,
)

const renderDescription = (text: string): string => renderRichText(text)

function handleClaim(): void {
  if (!relicInfo.value || claimed.value || alreadyOwned.value || relicLimitReached.value) return
  const result = playerStore.addRelic(relicInfo.value.className)
  if (!result.success) {
    return
  }
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
          <h1>固定レリック獲得</h1>
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
              :state-snapshots="[]"
              :show-hp-gauge="false"
            />
          </aside>
          <main class="main">
            <div v-if="relicInfo" class="relic-card" :class="{ 'relic-card--claimed': claimed }">
              <div class="relic-card__icon">{{ relicInfo.icon }}</div>
              <div class="relic-card__body">
                <div class="relic-card__title">{{ relicInfo.name }}</div>
                <div class="relic-card__type">種別: {{ relicInfo.usageType }}</div>
                <p class="relic-card__description" v-html="renderDescription(relicInfo.description)"></p>
                <p v-if="alreadyOwned" class="relic-card__owned">すでに所持しています</p>
                <p v-if="relicLimitReached" class="relic-card__limit">レリック上限に達しています</p>
              </div>
            </div>
            <div v-else class="relic-card relic-card--empty">獲得可能なレリックがありません</div>

            <div class="actions">
              <button type="button" class="action-button" :disabled="!canClaim" @click="handleClaim">
                獲得
              </button>
              <button type="button" class="action-button action-button--next" @click="handleProceed">
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
  gap: 20px;
  align-items: start;
}

.player-area {
  position: sticky;
  top: 20px;
}

.main {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.relic-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.relic-card__icon {
  font-size: 24px;
}

.relic-card__title {
  font-weight: 700;
  margin-bottom: 4px;
}

.relic-card__type {
  font-size: 13px;
  color: rgba(245, 242, 255, 0.7);
}

.relic-card__description {
  font-size: 13px;
  line-height: 1.4;
  color: rgba(245, 242, 255, 0.85);
}

.text-magnitude,
.text-variable {
  color: #31d39e;
  font-weight: 700;
}

.relic-card__owned {
  margin-top: 6px;
  color: #ffb3b3;
}

.relic-card__limit {
  margin-top: 6px;
  color: #ffcf7a;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.action-button {
  padding: 10px 16px;
  border-radius: 8px;
  background: #f6d365;
  color: #1a132b;
  border: none;
  cursor: pointer;
  font-weight: 700;
}

.action-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-button--next {
  background: #8bd3dd;
}
</style>
