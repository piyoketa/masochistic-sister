<!--
RewardView の責務:
- Battle 勝利時に rewardStore に保持された褒章カード一覧を表示し、選択したカードをデッキへ追加する。
- HP回復・ゴールド獲得など数値報酬を適用し、受け取り後に fieldStore を更新してフィールドへ戻る遷移を提供する。
- 戻り先フィールドを query パラメータ経由の fieldId で特定し、SecondField など別フィールドに戻せるようにする。

非責務:
- 報酬の計算（BattleReward に委譲）やバトル進行。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainGameLayout from '@/components/battle/MainGameLayout.vue'
import CardList from '@/components/CardList.vue'
import { useRewardStore } from '@/stores/rewardStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import { useAudioStore } from '@/stores/audioStore'
import { buildCardInfosFromBlueprints, type CardBlueprint } from '@/domain/library/Library'
import { PlayerStateProgressManager } from '@/domain/progress/PlayerStateProgressManager'

type RewardViewProps = {
  fieldId?: string
}

const props = defineProps<RewardViewProps>()

const rewardStore = useRewardStore()
const playerStore = usePlayerStore()
const fieldStore = useFieldStore()
const router = useRouter()
const audioStore = useAudioStore()

playerStore.ensureInitialized()

const reward = computed(() => rewardStore.pending)
const isProcessing = ref(false)
const claimError = ref<string | null>(null)
const selectedCardId = ref<string | null>(null)
const hpClaimed = ref(false)
const cardClaimed = ref(false)
const claimedCardTitle = ref<string | null>(null)

const rewardSummary = computed(() => ({
  defeatedCount: reward.value?.defeatedCount ?? 0,
  cardCount: reward.value?.cards.length ?? 0,
  goldGain: reward.value?.goldGain ?? 0,
  hpHeal: reward.value?.hpHeal ?? 0,
}))

const rewardBlueprints = computed<CardBlueprint[]>(() => reward.value?.cards ?? [])
const rewardCardInfos = computed(() => buildCardInfosFromBlueprints(rewardBlueprints.value, 'reward'))

const targetFieldId = computed(() => props.fieldId ?? fieldStore.field.id ?? 'first-field')
const targetFieldPath = computed(() => (targetFieldId.value === 'second-field' ? '/field/second' : '/field'))

const hasRewardCards = computed(() => rewardSummary.value.cardCount > 0)
const canClaimCard = computed(
  () =>
    Boolean(reward.value) &&
    !isProcessing.value &&
    selectedCardId.value !== null &&
    !cardClaimed.value,
)
const canClaimHp = computed(
  () => Boolean(reward.value) && !isProcessing.value && rewardSummary.value.hpHeal > 0 && !hpClaimed.value,
)
const hasRemainingRewards = computed(() => {
  const hpRemaining = rewardSummary.value.hpHeal > 0 && !hpClaimed.value
  const cardRemaining = hasRewardCards.value && !cardClaimed.value
  return hpRemaining || cardRemaining
})

onMounted(() => {
  if (!reward.value) {
    // バトルを経由せずに直接アクセスされた場合はフィールドへ戻す。fieldId をクエリに乗せて戻り先を明示する。
    void router.replace({ path: targetFieldPath.value, query: { fieldId: targetFieldId.value } })
    return
  }
  // 初期状態ではカードを自動選択せず、プレイヤーに明示的な選択操作を要求する
  selectedCardId.value = null
  hpClaimed.value = rewardSummary.value.hpHeal <= 0
  cardClaimed.value = rewardSummary.value.cardCount <= 0
})

function resolveSelectedBlueprint(): CardBlueprint | null {
  if (!reward.value || !selectedCardId.value) {
    return null
  }
  const idx = rewardCardInfos.value.findIndex((info) => info.id === selectedCardId.value)
  if (idx < 0) {
    return null
  }
  return rewardBlueprints.value[idx] ?? null
}

function addCardToDeck(blueprint: CardBlueprint): void {
  playerStore.addCard(blueprint)
}

async function handleClaimHp(): Promise<void> {
  if (!reward.value || isProcessing.value || hpClaimed.value || rewardSummary.value.hpHeal <= 0) {
    return
  }
  isProcessing.value = true
  claimError.value = null
  try {
    playerStore.healHp(rewardSummary.value.hpHeal)
    // 報酬回復は前半パートで -1、後半パートではダメージ表現の解除対象にする。
    new PlayerStateProgressManager({ store: playerStore }).recordRewardHeal(rewardSummary.value.hpHeal)
    audioStore.playSe('/sounds/fields/gain_hp.mp3')
    hpClaimed.value = true
  } catch (error) {
    claimError.value = error instanceof Error ? error.message : String(error)
  } finally {
    isProcessing.value = false
  }
}

async function handleClaimCard(): Promise<void> {
  if (!reward.value || isProcessing.value || cardClaimed.value || !selectedCardId.value) {
    return
  }
  isProcessing.value = true
  claimError.value = null
  try {
    const chosen = resolveSelectedBlueprint()
    if (chosen) {
      addCardToDeck(chosen)
      const claimedInfo = rewardCardInfos.value.find((info) => info.id === selectedCardId.value)
      claimedCardTitle.value = claimedInfo?.title ?? null
      cardClaimed.value = true
    }
  } catch (error) {
    claimError.value = error instanceof Error ? error.message : String(error)
  } finally {
    isProcessing.value = false
  }
}

async function handleReturn(): Promise<void> {
  // 残報酬があっても破棄してフィールドへ戻る
  fieldStore.markCurrentCleared()
  rewardStore.clear()
  // fieldId をクエリで渡して SecondField などにも戻せるようにする
  await router.push({ path: targetFieldPath.value, query: { fieldId: targetFieldId.value } })
}
</script>

<template>
  <MainGameLayout>
    <div class="reward-view">
      <header class="reward-header">
        <div class="reward-heading">
          <h1>報酬を獲得</h1>
          <p class="subtitle">デッキに加えるカードを１枚選んでください。</p>
        </div>
      <div class="reward-summary">
        <div class="summary-chip">
          <span class="chip-label">HP回復</span>
          <span class="chip-value">+{{ rewardSummary.hpHeal }}</span>
        </div>
        <!-- <div class="summary-chip">
          <span class="chip-label">ゴールド</span>
          <span class="chip-value">+{{ rewardSummary.goldGain }}</span>
        </div> -->
        <!-- <div class="summary-chip">
          <span class="chip-label">褒章カード</span>
          <span class="chip-value">{{ rewardSummary.cardCount }} 枚</span>
        </div> -->
      </div>
      </header>

      <CardList
        v-if="hasRewardCards"
        :cards="rewardCardInfos"
        :gap="16"
        :height="240"
        :hover-effect="true"
        :force-playable="true"
        selectable
        :disabled="cardClaimed"
        :selected-card-id="selectedCardId"
        @update:selected-card-id="(id) => {
          selectedCardId = (id as string) ?? null
        }"
      />

      <footer class="reward-actions">
        <button
          type="button"
          class="reward-button"
          :disabled="!canClaimCard"
          @click="handleClaimCard"
        >
          {{
            cardClaimed
              ? `獲得済み：${claimedCardTitle ?? 'カード'}`
              : 'カード報酬を受け取る'
          }}
        </button>
        <button
          type="button"
          class="reward-button"
          :disabled="!canClaimHp"
          @click="handleClaimHp"
        >
          HP回復を受け取る (+{{ rewardSummary.hpHeal }})
        </button>
        <button
          type="button"
          class="reward-button"
          :class="{ 'reward-button--secondary': hasRemainingRewards }"
          @click="handleReturn"
        >
          {{ hasRemainingRewards ? '報酬を破棄してフィールドに戻る' : 'フィールドに戻る' }}
        </button>
        <p class="action-note">報酬は個別に受け取れます。残っている報酬は破棄されます。</p>
        <p v-if="claimError" class="action-error">{{ claimError }}</p>
      </footer>
    </div>
  </MainGameLayout>
</template>

<style scoped>
.reward-view {
  padding: 24px clamp(16px, 4vw, 32px) 40px;
  color: #f5f2ff;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.reward-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 12px;
}

.reward-heading h1 {
  margin: 4px 0 6px;
  letter-spacing: 0.12em;
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.24em;
  color: rgba(245, 242, 255, 0.6);
}

.subtitle {
  margin: 0;
  color: rgba(245, 242, 255, 0.72);
  font-size: 13px;
}

.reward-summary {
  display: flex;
  gap: 10px;
  align-items: center;
}

.summary-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 12px;
  background: rgba(18, 16, 28, 0.8);
  min-width: 120px;
}

.chip-label {
  font-size: 12px;
  color: rgba(245, 242, 255, 0.6);
  letter-spacing: 0.08em;
}

.chip-value {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.card-section {
  background: rgba(16, 14, 24, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px 14px 16px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  max-height: 320px;
  overflow: hidden;
}

.card-note {
  margin: 8px 4px 0;
  font-size: 12px;
  color: rgba(245, 242, 255, 0.72);
}

.reward-empty {
  padding: 16px;
  background: rgba(18, 16, 28, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: rgba(245, 242, 255, 0.85);
}

.reward-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.reward-button {
  background: linear-gradient(90deg, rgba(255, 227, 115, 0.95), rgba(255, 188, 82, 0.95));
  color: #2d1a0f;
  border: none;
  border-radius: 12px;
  padding: 12px 18px;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 0.06em;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.35);
}

.reward-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.reward-button:not(:disabled):hover,
.reward-button:not(:disabled):focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.45);
}

.reward-button--secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #f5f2ff;
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow: none;
}

.action-note {
  margin: 0;
  font-size: 12px;
  color: rgba(245, 242, 255, 0.7);
}

.action-error {
  margin: 0;
  font-size: 12px;
  color: #ffb4c1;
}
</style>
