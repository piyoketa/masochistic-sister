<!--
RewardView の責務:
- Battle 勝利時に算出された報酬（HP回復/所持金/カード褒賞）を表示し、受け取る操作を提供する。
- rewardStore に保存された一時データを参照し、受け取り完了後は fieldStore へクリア状態を反映した上でフィールドへ戻す。

非責務:
- 報酬計算自体（BattleReward に委譲）。ここでは計算済みデータを表示するのみ。
- バトル進行やログ再生。純粋に UI と store 更新に限定する。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameLayout from '@/components/GameLayout.vue'
import CardList from '@/components/CardList.vue'
import { useRewardStore } from '@/stores/rewardStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'

const rewardStore = useRewardStore()
const playerStore = usePlayerStore()
const fieldStore = useFieldStore()
const router = useRouter()

playerStore.ensureInitialized()

const selectedCardId = ref<string | null>(null)
const claimed = ref(false)

const reward = computed(() => rewardStore.pending)

const playerStatus = computed(() => ({
  hp: playerStore.hp,
  maxHp: playerStore.maxHp,
  gold: playerStore.gold,
  deckCount: playerStore.deck.length,
}))

const cardSelectionRequired = computed(() => (reward.value?.cards.length ?? 0) > 0)
const claimDisabled = computed(
  () => !reward.value || (cardSelectionRequired.value && !selectedCardId.value) || claimed.value,
)

onMounted(() => {
  // 報酬がない状態で来た場合はフィールドへ戻す。
  if (!reward.value) {
    router.replace('/field')
    return
  }
  const firstCard = reward.value.cards[0]
  selectedCardId.value = firstCard?.id ?? null
})

function handleCardClick(cardId: string): void {
  if (claimed.value) return
  selectedCardId.value = selectedCardId.value === cardId ? null : cardId
}

function applyRewards(): void {
  const pending = reward.value
  if (!pending || claimed.value) return

  if (pending.hpHeal > 0) {
    playerStore.healHp(pending.hpHeal)
  }
  if (pending.gold > 0) {
    playerStore.addGold(pending.gold)
  }

  if (pending.cards.length > 0 && selectedCardId.value) {
    const entry = pending.cards.find((card) => card.id === selectedCardId.value)
    if (entry?.deckType) {
      playerStore.addCard(entry.deckType)
    }
  }

  claimed.value = true
}

async function returnToField(): Promise<void> {
  if (!claimed.value) {
    // 受け取り漏れ防止のため、未受領なら何もしない。
    return
  }
  fieldStore.markCurrentCleared()
  rewardStore.clear()
  await router.push('/field')
}
</script>

<template>
  <GameLayout>
    <template #default>
      <div class="reward-view">
        <header class="reward-header">
          <div>
            <h1>戦利品</h1>
            <p>勝利報酬を受け取ってフィールドに戻ります。</p>
          </div>
          <div class="status">
            <span>HP: {{ playerStatus.hp }} / {{ playerStatus.maxHp }}</span>
            <span>Gold: {{ playerStatus.gold }}</span>
            <span>デッキ: {{ playerStatus.deckCount }}枚</span>
          </div>
        </header>

        <section v-if="reward" class="reward-body">
          <div class="reward-cards">
            <div class="reward-item">
              <div class="reward-label">HP回復</div>
              <div class="reward-value">+{{ reward.hpHeal }}</div>
            </div>
            <div class="reward-item">
              <div class="reward-label">所持金</div>
              <div class="reward-value">+{{ reward.gold }}</div>
            </div>
          </div>

          <div class="card-section">
            <div class="card-section__header">
              <h3>新規カードから1枚獲得</h3>
              <span class="card-section__note">
                選択後に受け取ると、デッキへ追加されます（[新規]タグは除外）。
              </span>
            </div>
            <div class="card-list-wrapper" :class="{ 'card-list-wrapper--disabled': claimed }">
              <CardList
                :cards="reward.cards.map((entry) => entry.info)"
                title="褒賞カード"
                :gap="50"
                selectable
                :selected-card-id="selectedCardId"
                :hover-effect="!claimed"
                @card-click="(card) => handleCardClick(card.id)"
                @update:selected-card-id="(id) => handleCardClick(id as string)"
              />
            </div>
          </div>

          <div class="actions">
            <button type="button" class="reward-button" :disabled="claimDisabled" @click="applyRewards">
              受け取る
            </button>
            <button type="button" class="reward-button reward-button--secondary" :disabled="!claimed" @click="returnToField">
              フィールドに戻る
            </button>
          </div>
        </section>
      </div>
    </template>
  </GameLayout>
</template>

<style scoped>
.reward-view {
  min-height: 100vh;
  padding: 32px clamp(20px, 5vw, 64px);
  color: #f5f2ff;
}

.reward-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}

.reward-header h1 {
  margin: 0;
  letter-spacing: 0.12em;
}

.reward-header p {
  margin: 4px 0 0;
  color: rgba(245, 242, 255, 0.7);
}

.status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: rgba(245, 242, 255, 0.85);
  min-width: 180px;
}

.reward-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reward-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.reward-item {
  background: rgba(18, 16, 28, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px;
}

.reward-label {
  font-size: 13px;
  color: rgba(245, 242, 255, 0.7);
}

.reward-value {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.card-section__header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.card-section__header h3 {
  margin: 0;
}

.card-section__note {
  font-size: 12px;
  color: rgba(245, 242, 255, 0.75);
}

.card-list-wrapper {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 8px 12px;
  background: rgba(16, 14, 24, 0.8);
}

.card-list-wrapper--disabled {
  pointer-events: none;
  opacity: 0.9;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.reward-button {
  background: rgba(255, 227, 115, 0.95);
  color: #2d1a0f;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 0.04em;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
}

.reward-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reward-button:not(:disabled):hover,
.reward-button:not(:disabled):focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
}

.reward-button--secondary {
  background: rgba(120, 205, 255, 0.95);
  color: #0d1a2f;
}
</style>
