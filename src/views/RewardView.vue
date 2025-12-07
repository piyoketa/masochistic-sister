<!--
RewardView の責務:
- Battle 勝利時に rewardStore に保持された褒章カード一覧を表示し、全てまとめてデッキへ追加する。
- 受け取り処理完了後に fieldStore を更新してフィールドへ戻る遷移を提供する。

非責務:
- 報酬の計算（BattleReward に委譲）やバトル進行。
- HP/所持金などの数値報酬付与（現仕様では取り扱わない）。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainGameLayout from '@/components/battle/MainGameLayout.vue'
import CardList from '@/components/CardList.vue'
import { useRewardStore, type RewardCardEntry } from '@/stores/rewardStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import { useAudioStore } from '@/stores/audioStore'

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

const rewardSummary = computed(() => ({
  defeatedCount: reward.value?.defeatedCount ?? 0,
  cardCount: reward.value?.cards.length ?? 0,
}))

const rewardCardInfos = computed(() => reward.value?.cards.map((entry) => entry.info) ?? [])

const hasRewardCards = computed(() => rewardSummary.value.cardCount > 0)
const canClaim = computed(() => Boolean(reward.value) && !isProcessing.value && selectedCardId.value !== null)

onMounted(() => {
  if (!reward.value) {
    // バトルを経由せずに直接アクセスされた場合はフィールドへ戻す。
    void router.replace('/field')
    return
  }
  // 初期状態ではカードを自動選択せず、プレイヤーに明示的な選択操作を要求する
  selectedCardId.value = null
})

function addCardToDeck(entry: RewardCardEntry): void {
  if (!entry.deckType) {
    // deckType が解決できない褒章カードは破損データ扱いとし、追加をスキップする。
    return
  }
  const info = entry.info
  let overrideAmount: number | undefined
  let overrideCount: number | undefined
  if (info.type === 'attack') {
    overrideAmount = info.damageAmount
    // 攻撃カテゴリは attackStyle で判定する。連続攻撃のダメージ回数は状態異常で変動してもカテゴリが変わらないため、
    // count の実値だけで一回攻撃かどうかを推定しない。
    overrideCount = info.attackStyle === 'multi' ? info.damageCount : 1
  }
  playerStore.addCard(entry.deckType, { amount: overrideAmount, count: overrideCount })
}

async function handleClaimAll(): Promise<void> {
  if (!reward.value || isProcessing.value || !selectedCardId.value) {
    return
  }
  isProcessing.value = true
  claimError.value = null
  try {
    // 選択したカードのみ追加
    const chosen = reward.value.cards.find((entry) => entry.id === selectedCardId.value)
    if (chosen) {
      addCardToDeck(chosen)
    }
    // HP回復を適用
    if (reward.value.hpHeal > 0) {
      playerStore.healHp(reward.value.hpHeal)
      audioStore.playSe('/sounds/fields/gain_hp.mp3')
    }
    fieldStore.markCurrentCleared()
    rewardStore.clear()
    await router.push('/field')
  } catch (error) {
    claimError.value = error instanceof Error ? error.message : String(error)
    isProcessing.value = false
  }
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
          <!-- <div class="summary-chip">
            <span class="chip-label">撃破</span>
            <span class="chip-value">{{ rewardSummary.defeatedCount }} 体</span>
          </div> -->
          <div class="summary-chip">
            <span class="chip-label">HP回復</span>
            <span class="chip-value">+{{ reward?.hpHeal ?? 0 }}</span>
          </div>
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
        :selected-card-id="selectedCardId"
        @update:selected-card-id="(id) => {
          selectedCardId = (id as string) ?? null
        }"
      />

      <footer class="reward-actions">
        <button
          type="button"
          class="reward-button"
          :disabled="!canClaim"
          @click="handleClaimAll"
        >
          報酬を獲得してフィールドに戻る
        </button>
        <p class="action-note">ボタンを押すと褒章カードを全て受け取り、フィールドへ遷移します。</p>
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
