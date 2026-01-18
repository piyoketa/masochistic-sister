<!--
PreSortieSetupView の責務:
- 出撃前の設定ページとして、出撃先情報と実績一覧（報酬/称号）を表示する。
- 報酬タブでは記憶ポイントの範囲内で報酬を選択し、「ゲーム開始」で報酬を付与する。
- 「ゲーム開始」操作でスタートマスをクリア扱いにし、フィールド画面へ戻す導線を提供する。

責務ではないこと:
- 実績達成判定や進行度の集計は扱わない（ストアに委譲する）。
- フィールド進行の詳細なノード選択は行わない（フィールド画面で操作する）。

主な通信相手とインターフェース:
- fieldStore: フィールド初期化と現在マスのクリア処理を行う。
- useAchievementWindow: 実績表示用のデータを受け取る（報酬の適用は achievementStore を利用）。
- router: フィールド画面への遷移を行う。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameLayout from '@/components/GameLayout.vue'
import { useFieldStore } from '@/stores/fieldStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { usePlayerStore } from '@/stores/playerStore'
import { useAchievementWindow } from '@/composables/useAchievementWindow'
import type {
  RewardAchievementCardView,
  TitleAchievementRowView,
} from '@/components/AchievementWindow.vue'
import { FIELD_LABELS, isFieldId, resolveFieldPath } from '@/constants/fieldProgress'

type PreSortieSetupProps = {
  fieldId?: string
}

const props = defineProps<PreSortieSetupProps>()
const router = useRouter()
const fieldStore = useFieldStore()

const targetFieldId = computed(() => props.fieldId ?? fieldStore.field.id ?? 'first-field')
const targetFieldLabel = computed(() => {
  const id = targetFieldId.value
  return isFieldId(id) ? FIELD_LABELS[id] : id
})

// 仕様: 被虐レベルは固定値で表示する（実データ連携は別タスクで行う）。
const masochisticLevel = 1

const {
  rewardEntries: rewardAchievementEntries,
  titleEntries: titleAchievementEntries,
} = useAchievementWindow()
const achievementStore = useAchievementStore()
achievementStore.ensureInitialized()
const playerStore = usePlayerStore()
playerStore.ensureInitialized()

const activeTab = ref<'reward' | 'title'>('reward')
const selectedRewardIds = ref<Set<string>>(new Set())

const rewardStatusLabels: Record<RewardAchievementCardView['status'], string> = {
  'not-achieved': '未達成',
  achieved: '達成',
}

const rewardStatusVariants: Record<RewardAchievementCardView['status'], string> = {
  'not-achieved': 'reward-row--not-achieved',
  achieved: 'reward-row--achieved',
}

const titleStatusLabels: Record<TitleAchievementRowView['status'], string> = {
  'not-achieved': '未達成',
  achieved: '達成',
}

function progressWidth(ratio?: number): string {
  const safe = Math.min(Math.max(ratio ?? 0, 0), 1)
  return `${safe * 100}%`
}

const selectedRewardEntries = computed(() =>
  rewardAchievementEntries.value.filter((entry) => selectedRewardIds.value.has(entry.id)),
)
const totalMemoryPoints = computed(() => achievementStore.earnedMemoryPointsTotal)
const usedMemoryPoints = computed(() =>
  selectedRewardEntries.value.reduce((sum, entry) => sum + entry.memoryPointCost, 0),
)
const selectedRelicLimitIncrease = computed(() =>
  selectedRewardEntries.value.reduce((sum, entry) => sum + Math.max(0, entry.relicLimitIncrease ?? 0), 0),
)
// 設計判断: レリック上限の拡張を先に反映し、選択可能なレリック数を事前計算する。
const effectiveRelicLimit = computed(
  () => playerStore.relicLimit + selectedRelicLimitIncrease.value,
)
const selectedRelicCount = computed(
  () => selectedRewardEntries.value.filter((entry) => entry.rewardType === 'relic').length,
)
const selectedRelicNames = computed(() => {
  // 重複レリックの選択を防ぐため、選択済みのクラス名を集計する。
  const names = new Set<string>()
  selectedRewardEntries.value.forEach((entry) => {
    if (entry.rewardType === 'relic' && entry.relicClassName) {
      names.add(entry.relicClassName)
    }
  })
  return names
})
const availableRelicSlots = computed(
  () => Math.max(0, effectiveRelicLimit.value - playerStore.relics.length),
)

function isRewardSelected(entry: RewardAchievementCardView): boolean {
  return selectedRewardIds.value.has(entry.id)
}

function canSelectReward(entry: RewardAchievementCardView): boolean {
  // 設計判断: 達成済み・記憶ポイント範囲内・レリック枠内だけ選択を許可する。
  if (isRewardSelected(entry)) {
    return true
  }
  if (entry.status !== 'achieved') {
    return false
  }
  const nextCost = usedMemoryPoints.value + entry.memoryPointCost
  if (nextCost > totalMemoryPoints.value) {
    return false
  }
  if (entry.rewardType === 'relic') {
    if (!entry.relicClassName) {
      return false
    }
    if (playerStore.relics.includes(entry.relicClassName)) {
      return false
    }
    if (selectedRelicNames.value.has(entry.relicClassName)) {
      return false
    }
    return selectedRelicCount.value + 1 <= availableRelicSlots.value
  }
  return true
}

function toggleRewardSelection(entry: RewardAchievementCardView): void {
  // 設計判断: 選択の可否は画面側で閉じ、ストアへの不正入力を防ぐ。
  if (!canSelectReward(entry)) {
    return
  }
  const next = new Set(selectedRewardIds.value)
  if (next.has(entry.id)) {
    next.delete(entry.id)
  } else {
    next.add(entry.id)
  }
  selectedRewardIds.value = next
}

async function handleStartGame(): Promise<void> {
  if (selectedRewardIds.value.size > 0) {
    const result = achievementStore.applyRewardSelection([...selectedRewardIds.value])
    if (!result.success) {
      window.alert(result.message)
      return
    }
  }
  // 設計判断: StartStoryView と同じ進行規則に合わせ、現在マスをクリア扱いにしてから戻る。
  fieldStore.markCurrentCleared()
  const nextPath = isFieldId(targetFieldId.value) ? resolveFieldPath(targetFieldId.value) : '/field'
  await router.push(nextPath)
}

onMounted(() => {
  // フィールド開始時に指定されたフィールドを初期化する（別フィールド導線にも対応）
  if (fieldStore.field.id !== targetFieldId.value) {
    fieldStore.initializeField(targetFieldId.value)
  }
})
</script>

<template>
  <GameLayout>
    <template #window>
      <div class="pre-sortie">
        <header class="pre-sortie__header">
          <div class="pre-sortie__title">
            <p class="pre-sortie__eyebrow">Pre-Sortie Setup</p>
            <h1>出撃前の設定</h1>
            <p class="pre-sortie__subtitle">出撃前に実績報酬と称号を確認できます。</p>
          </div>
          <button type="button" class="pre-sortie__start" @click="handleStartGame">
            ゲーム開始
          </button>
        </header>

        <section class="pre-sortie__summary">
          <div class="summary-card">
            <div class="summary-card__label">出撃先</div>
            <div class="summary-card__value">{{ targetFieldLabel }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-card__label">被虐レベル</div>
            <div class="summary-card__value">{{ masochisticLevel }}</div>
          </div>
        </section>

        <section class="achievement-panel">
          <header class="achievement-panel__header">
            <div class="achievement-panel__title">
              <h2>実績</h2>
              <p>報酬/称号の進行と獲得状況を確認できます。</p>
            </div>
            <div class="achievement-panel__controls">
              <div v-if="activeTab === 'reward'" class="achievement-summary achievement-summary--header">
                <span class="achievement-summary__label">記憶ポイント使用量</span>
                <span class="achievement-summary__value">
                  {{ usedMemoryPoints }} / {{ totalMemoryPoints }} pt
                </span>
              </div>
              <div v-else class="achievement-summary achievement-summary--header">
                <span class="achievement-summary__label">獲得記憶ポイント</span>
                <span class="achievement-summary__value">{{ totalMemoryPoints }} pt</span>
              </div>
              <div class="achievement-panel__tabs">
                <button
                  type="button"
                  class="achievement-panel__tab"
                  :class="{ 'achievement-panel__tab--active': activeTab === 'reward' }"
                  @click="activeTab = 'reward'"
                >
                  報酬
                </button>
                <button
                  type="button"
                  class="achievement-panel__tab"
                  :class="{ 'achievement-panel__tab--active': activeTab === 'title' }"
                  @click="activeTab = 'title'"
                >
                  称号
                </button>
              </div>
            </div>
          </header>

          <div class="achievement-panel__body">
            <div v-if="activeTab === 'reward'" class="achievement-section">
              <div class="reward-list">
                <article
                  v-for="entry in rewardAchievementEntries"
                  :key="entry.id"
                  class="reward-row"
                  :class="[rewardStatusVariants[entry.status], { 'reward-row--selected': isRewardSelected(entry) }]"
                >
                  <div class="reward-row__status">{{ rewardStatusLabels[entry.status] }}</div>
                  <div class="reward-row__body">
                    <div v-if="entry.status === 'not-achieved'" class="reward-row__condition">
                      {{ entry.description }}
                    </div>
                    <div v-else class="reward-row__title">{{ entry.title }}</div>
                    <div v-if="entry.status === 'not-achieved' && entry.progressLabel" class="reward-row__progress">
                      <div class="reward-row__progress-label">進行: {{ entry.progressLabel }}</div>
                      <div class="reward-row__progress-bar">
                        <span class="reward-row__progress-fill" :style="{ width: progressWidth(entry.progressRatio) }" />
                      </div>
                    </div>
                  </div>
                  <div class="reward-row__meta">
                    <div v-if="entry.status !== 'not-achieved'" class="reward-row__reward">
                      <span class="reward-row__reward-chip">報酬</span>
                      <span class="reward-row__reward-text">{{ entry.rewardLabel }}</span>
                    </div>
                    <div v-if="entry.status !== 'not-achieved'" class="reward-row__cost">
                      {{ entry.costLabel }}
                    </div>
                    <label
                      v-if="entry.status !== 'not-achieved'"
                      class="reward-row__select"
                      :class="{ 'reward-row__select--disabled': !canSelectReward(entry) }"
                    >
                      <input
                        type="checkbox"
                        class="reward-row__checkbox"
                        :checked="isRewardSelected(entry)"
                        :disabled="!canSelectReward(entry)"
                        @change="toggleRewardSelection(entry)"
                      />
                      <span>{{ isRewardSelected(entry) ? '選択中' : '選択' }}</span>
                    </label>
                  </div>
                </article>
              </div>
            </div>

            <div v-else class="achievement-section">
              <div class="title-list">
                <article
                  v-for="entry in titleAchievementEntries"
                  :key="entry.id"
                  class="title-row"
                  :class="{ 'title-row--achieved': entry.status === 'achieved' }"
                >
                  <div class="title-row__status">{{ titleStatusLabels[entry.status] }}</div>
                  <div class="title-row__body">
                    <div v-if="entry.status === 'achieved'" class="title-row__title">
                      {{ entry.title }}
                    </div>
                    <div v-else class="title-row__condition">
                      {{ entry.description }}
                    </div>
                    <div v-if="entry.status === 'not-achieved' && entry.progressLabel" class="title-row__progress">
                      <div class="title-row__progress-label">{{ entry.progressLabel }}</div>
                      <div class="title-row__progress-bar">
                        <span class="title-row__progress-fill" :style="{ width: progressWidth(entry.progressRatio) }" />
                      </div>
                    </div>
                  </div>
                  <div class="title-row__point">{{ entry.pointLabel }}</div>
                </article>
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </GameLayout>
</template>

<style scoped>
.pre-sortie {
  --ink: #f6efe6;
  --muted: rgba(246, 239, 230, 0.75);
  --accent: #ffb45d;
  --accent-strong: #ff8c52;
  --panel-bg: rgba(18, 14, 22, 0.9);
  --panel-border: rgba(255, 255, 255, 0.12);
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: clamp(20px, 4vw, 36px);
  box-sizing: border-box;
  color: var(--ink);
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  background:
    radial-gradient(circle at 15% 10%, rgba(255, 140, 80, 0.22), transparent 45%),
    radial-gradient(circle at 80% 0%, rgba(120, 90, 190, 0.25), transparent 50%),
    linear-gradient(160deg, #0d0a12, #1a121b 55%, #2a171f);
  position: relative;
  overflow: hidden;
}

.pre-sortie::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.03) 0,
    rgba(255, 255, 255, 0.03) 2px,
    transparent 2px,
    transparent 8px
  );
  pointer-events: none;
}

.pre-sortie__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.pre-sortie__title h1 {
  margin: 0 0 4px;
  font-size: clamp(24px, 3vw, 32px);
  letter-spacing: 0.08em;
}

.pre-sortie__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--muted);
}

.pre-sortie__subtitle {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}

.pre-sortie__start {
  padding: 12px 22px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(130deg, #ffe09a, #ffb25f 60%, #ff8c52);
  color: #2b170b;
  font-weight: 800;
  letter-spacing: 0.12em;
  cursor: pointer;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.35);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.pre-sortie__start:hover,
.pre-sortie__start:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.4);
}

.pre-sortie__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  position: relative;
  z-index: 1;
}

.summary-card {
  padding: 14px 16px;
  border-radius: 14px;
  background: rgba(12, 8, 18, 0.78);
  border: 1px solid var(--panel-border);
  box-shadow: inset 0 0 18px rgba(0, 0, 0, 0.4);
}

.summary-card__label {
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 0.12em;
}

.summary-card__value {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.achievement-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  box-shadow: 0 18px 32px rgba(0, 0, 0, 0.4);
  position: relative;
  z-index: 1;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.achievement-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.achievement-panel__title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.achievement-panel__header h2 {
  margin: 0 0 4px;
  font-size: 18px;
  letter-spacing: 0.08em;
}

.achievement-panel__header p {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
}

.achievement-panel__controls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.achievement-panel__tabs {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.achievement-panel__tab {
  border: none;
  background: transparent;
  color: var(--muted);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.12em;
  cursor: pointer;
}

.achievement-panel__tab--active {
  background: rgba(255, 176, 100, 0.2);
  color: #ffe9c8;
  box-shadow: inset 0 0 10px rgba(255, 176, 100, 0.2);
}

.achievement-panel__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.achievement-summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(8, 6, 12, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 12px;
}

.achievement-summary--header {
  min-width: 200px;
}

.achievement-summary__label {
  color: var(--muted);
  letter-spacing: 0.1em;
}

.achievement-summary__value {
  font-weight: 700;
  letter-spacing: 0.08em;
}

.reward-list,
.title-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reward-row,
.title-row {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  background: rgba(6, 4, 10, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.reward-row--not-achieved,
.title-row {
  opacity: 0.9;
}

.reward-row--achieved {
  border-color: rgba(255, 193, 120, 0.45);
}

.reward-row--selected {
  box-shadow: 0 0 0 1px rgba(255, 176, 100, 0.45), 0 10px 20px rgba(0, 0, 0, 0.2);
}

.reward-row__status,
.title-row__status {
  font-size: 12px;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.reward-row__title,
.title-row__title {
  font-weight: 700;
  letter-spacing: 0.06em;
}

.title-row__condition {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.reward-row__progress,
.title-row__progress {
  margin-top: 8px;
}

.reward-row__progress-label,
.title-row__progress-label {
  font-size: 11px;
  color: var(--muted);
}

.reward-row__progress-bar,
.title-row__progress-bar {
  margin-top: 4px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.reward-row__progress-fill,
.title-row__progress-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 193, 120, 0.8), rgba(255, 110, 90, 0.9));
  border-radius: 999px;
}

.reward-row__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  min-width: 140px;
}

.reward-row__reward {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #ffe2c4;
}

.reward-row__reward-chip {
  background: rgba(255, 176, 100, 0.2);
  border: 1px solid rgba(255, 176, 100, 0.45);
  padding: 2px 8px;
  border-radius: 999px;
  letter-spacing: 0.08em;
  font-size: 10px;
}

.reward-row__cost {
  font-size: 13px;
  font-weight: 700;
  color: #ffe9c8;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 176, 100, 0.55);
  background: rgba(255, 176, 100, 0.22);
  letter-spacing: 0.08em;
  box-shadow: inset 0 0 10px rgba(255, 176, 100, 0.2);
}

.reward-row__select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #ffe6c4;
  cursor: pointer;
}

.reward-row__select--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.reward-row__checkbox {
  width: 14px;
  height: 14px;
  accent-color: var(--accent-strong);
  cursor: pointer;
}

.reward-row__select--disabled .reward-row__checkbox {
  cursor: not-allowed;
}

.title-row__point {
  font-size: 12px;
  color: #ffd69d;
  letter-spacing: 0.1em;
}

@media (max-width: 900px) {
  .pre-sortie__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .achievement-panel__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .achievement-panel__controls {
    align-items: flex-start;
  }

  .achievement-summary--header {
    width: 100%;
  }

  .reward-row,
  .title-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .reward-row__meta {
    align-items: flex-start;
    min-width: auto;
  }
}
</style>
