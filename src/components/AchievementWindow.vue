<!--
Componentの責務:
- 実績ウィンドウをモーダルとして表示し、「報酬」「称号」タブの切り替えと一覧描画を担当する。
- 「獲得」ボタン押下をイベントとして親へ通知し、表示だけに専念する。

責務ではないこと:
- 実績達成判定、記憶ポイント集計、報酬の付与や永続化。これらはストア/親コンポーネントで完結させる。

主な通信相手とインターフェース:
- 親コンポーネント（FieldView など）。
  - props:
    - visible: モーダルの表示/非表示。
    - rewardEntries: RewardAchievementCardView[]。報酬実績の表示カードで、status は not-achieved/achieved/owned を持つ。
    - titleEntries: TitleAchievementRowView[]。称号実績の行表示で、status は not-achieved/achieved のみ（報酬と違い owned を持たない）。
    - memoryPointSummary: MemoryPointSummary（used/total/available の集計結果）。
  - events:
    - close: モーダルを閉じる要求。
    - claim: { id: string } を通知し、報酬獲得処理は親に委譲する。
-->
<script setup lang="ts">
import { ref } from 'vue'
import type { AchievementStatus } from '@/stores/achievementStore'

export type RewardAchievementCardView = {
  id: string
  title: string
  description: string
  rewardLabel: string
  status: AchievementStatus
  progressLabel?: string
  progressRatio?: number
  costLabel: string
  canClaim: boolean
}

export type TitleAchievementStatus = 'not-achieved' | 'achieved'

export type TitleAchievementRowView = {
  id: string
  title: string
  description: string
  status: TitleAchievementStatus
  progressLabel?: string
  progressRatio?: number
  pointLabel: string
}

export type MemoryPointSummary = {
  used: number
  total: number
  available: number
}

defineProps<{
  visible: boolean
  rewardEntries: RewardAchievementCardView[]
  titleEntries: TitleAchievementRowView[]
  memoryPointSummary: MemoryPointSummary
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'claim', payload: { id: string }): void
}>()

const activeTab = ref<'reward' | 'title'>('reward')

const rewardStatusLabels: Record<AchievementStatus, string> = {
  'not-achieved': '未達成',
  achieved: '達成',
  owned: '所持中',
}

const rewardStatusVariants: Record<AchievementStatus, string> = {
  'not-achieved': 'achievement-card--not-achieved',
  achieved: 'achievement-card--achieved',
  owned: 'achievement-card--owned',
}

const titleStatusLabels: Record<TitleAchievementStatus, string> = {
  'not-achieved': '未達成',
  achieved: '達成',
}

function progressWidth(ratio?: number): string {
  const safe = Math.min(Math.max(ratio ?? 0, 0), 1)
  return `${safe * 100}%`
}

function handleClaim(entry: RewardAchievementCardView): void {
  // ボタン表示条件は親で判定済みだが、誤操作防止のためここでもガードする。
  if (!entry.canClaim) {
    return
  }
  emit('claim', { id: entry.id })
}
</script>

<template>
  <transition name="achievement-overlay">
    <div
      v-if="visible"
      class="achievement-overlay"
      @contextmenu.prevent="emit('close')"
    >
      <div class="achievement-window">
        <header class="achievement-window__header">
          <div class="achievement-window__title">
            <div class="achievement-window__icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" role="presentation" focusable="false">
                <path
                  d="M4 5h24v4c0 4.4-4.2 7.7-10 8.9V21h3a1 1 0 0 1 0 2h-3v2.5a1.5 1.5 0 0 1-3 0V23h-3a1 1 0 0 1 0-2h3v-3.1C8.2 16.7 4 13.4 4 9.1zm2 2v2.1C6 11.8 9.9 14 16 14s10-2.2 10-4.9V7z"
                  fill="currentColor"
                />
                <path
                  d="m16 3 2.2 4.4 4.8.7-3.5 3.4.8 4.8L16 13.7l-4.3 2.6.8-4.8-3.5-3.4 4.8-.7z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <div class="achievement-window__title-text">実績</div>
              <div class="achievement-window__subtitle">報酬と称号を切り替えて確認できます。</div>
            </div>
          </div>
          <div class="achievement-window__controls">
            <button type="button" class="achievement-window__close" aria-label="閉じる" @click="emit('close')">
              ×
            </button>
          </div>
        </header>

        <div class="achievement-window__tabs">
          <button
            type="button"
            class="achievement-window__tab"
            :class="{ 'achievement-window__tab--active': activeTab === 'reward' }"
            @click="activeTab = 'reward'"
          >
            報酬
          </button>
          <button
            type="button"
            class="achievement-window__tab"
            :class="{ 'achievement-window__tab--active': activeTab === 'title' }"
            @click="activeTab = 'title'"
          >
            称号
          </button>
        </div>

        <div class="achievement-window__body">
          <div v-if="activeTab === 'reward'" class="achievement-section">
            <div class="achievement-summary">
              <span class="achievement-summary__label">記憶ポイント使用量</span>
              <span class="achievement-summary__value">
                {{ memoryPointSummary.used }} / {{ memoryPointSummary.total }} pt
              </span>
            </div>
            <div class="achievement-grid">
              <article
                v-for="entry in rewardEntries"
                :key="entry.id"
                class="achievement-card"
                :class="rewardStatusVariants[entry.status]"
              >
                <div class="achievement-card__status">
                  <span class="achievement-card__status-dot" />
                  {{ rewardStatusLabels[entry.status] }}
                </div>
                <div class="achievement-card__title">{{ entry.title }}</div>
                <p class="achievement-card__description">{{ entry.description }}</p>

                <div v-if="entry.status === 'not-achieved' && entry.progressLabel" class="achievement-card__progress">
                  <div class="achievement-card__progress-label">進行: {{ entry.progressLabel }}</div>
                  <div class="achievement-card__progress-bar">
                    <span class="achievement-card__progress-fill" :style="{ width: progressWidth(entry.progressRatio) }" />
                  </div>
                </div>

                <div class="achievement-card__reward">
                  <span class="achievement-card__reward-chip">報酬</span>
                  <span class="achievement-card__reward-text">{{ entry.rewardLabel }}</span>
                  <span class="achievement-card__cost">{{ entry.costLabel }}</span>
                </div>

                <div class="achievement-card__footer">
                  <span class="achievement-card__status-label">{{ rewardStatusLabels[entry.status] }}</span>
                  <button
                    v-if="entry.canClaim"
                    type="button"
                    class="achievement-card__action"
                    @click="handleClaim(entry)"
                  >
                    獲得
                  </button>
                </div>
              </article>
            </div>
          </div>

          <div v-else class="achievement-section">
            <div class="achievement-summary">
              <span class="achievement-summary__label">獲得記憶ポイント</span>
              <span class="achievement-summary__value">{{ memoryPointSummary.total }} pt</span>
            </div>
            <div class="title-list">
              <article
                v-for="entry in titleEntries"
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
      </div>
    </div>
  </transition>
</template>

<style scoped>
.achievement-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(82, 75, 120, 0.35), rgba(6, 6, 12, 0.82));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 120;
  backdrop-filter: blur(4px);
}

.achievement-window {
  width: min(1080px, 96vw);
  max-height: 82vh;
  background: linear-gradient(180deg, rgba(30, 26, 40, 0.96), rgba(12, 10, 16, 0.94));
  border-radius: 18px;
  box-shadow: 0 26px 60px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.achievement-window__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #f2eef8;
}

.achievement-window__title {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.achievement-window__icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: radial-gradient(circle at 30% 20%, rgba(255, 229, 127, 0.9), rgba(188, 142, 58, 0.9));
  color: #2c1c05;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 28px rgba(255, 202, 113, 0.3);
}

.achievement-window__icon svg {
  width: 26px;
  height: 26px;
}

.achievement-window__title-text {
  font-weight: 800;
  letter-spacing: 0.08em;
  font-size: 17px;
}

.achievement-window__subtitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

.achievement-window__controls {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.achievement-window__close {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fdfdfd;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
}

.achievement-window__close:hover,
.achievement-window__close:focus-visible {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.achievement-window__tabs {
  display: flex;
  gap: 8px;
  padding: 10px 16px 0;
}

.achievement-window__tab {
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px 12px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: none;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(242, 236, 255, 0.7);
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: color 140ms ease, background 140ms ease, border-color 140ms ease;
}

.achievement-window__tab--active {
  background: linear-gradient(90deg, rgba(255, 227, 115, 0.22), rgba(255, 150, 92, 0.16));
  color: #fff4c4;
  border-color: rgba(255, 216, 102, 0.5);
}

.achievement-window__body {
  padding: 16px 16px 18px;
  overflow-y: auto; /* カード数が20枚以上でもスクロールで全件確認できるようにする */
}

.achievement-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.achievement-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(120, 170, 255, 0.14);
  border: 1px solid rgba(120, 170, 255, 0.25);
  color: #e6f0ff;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.achievement-summary__label {
  font-size: 12px;
  color: rgba(230, 238, 255, 0.78);
}

.achievement-summary__value {
  font-size: 14px;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.achievement-card {
  position: relative;
  border-radius: 14px;
  padding: 14px;
  min-height: 180px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(180deg, rgba(28, 26, 36, 0.9), rgba(16, 14, 22, 0.92));
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.achievement-card__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.8);
}

.achievement-card__status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.07);
}

.achievement-card__title {
  font-weight: 800;
  font-size: 15px;
  color: #f8f5ff;
}

.achievement-card__description {
  margin: 0;
  font-size: 13px;
  color: rgba(230, 227, 240, 0.88);
  line-height: 1.5;
}

.achievement-card__progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.achievement-card__progress-label {
  font-size: 12px;
  color: rgba(220, 215, 235, 0.8);
}

.achievement-card__progress-bar {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.achievement-card__progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, #ffd166, #ff7f50);
  transition: width 200ms ease;
}

.achievement-card__reward {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #fdf7e3;
}

.achievement-card__reward-chip {
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(255, 227, 115, 0.15);
  border: 1px solid rgba(255, 227, 115, 0.5);
  color: #ffe181;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.achievement-card__reward-text {
  font-weight: 700;
}

.achievement-card__cost {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(122, 186, 255, 0.16);
  border: 1px solid rgba(122, 186, 255, 0.45);
  color: #d6e8ff;
  font-size: 12px;
}

.achievement-card__footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.achievement-card__status-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.78);
}

.achievement-card__action {
  min-width: 120px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 227, 115, 0.16);
  color: #ffe181;
  font-weight: 800;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease, border-color 140ms ease;
}

.achievement-card__action:hover,
.achievement-card__action:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.35);
  background: rgba(255, 227, 115, 0.28);
  border-color: rgba(255, 227, 115, 0.7);
}

.achievement-card--not-achieved {
  border-color: rgba(255, 255, 255, 0.08);
}

.achievement-card--not-achieved .achievement-card__status-dot {
  background: #7a7f92;
}

.achievement-card--achieved {
  border-color: rgba(255, 216, 102, 0.8);
  box-shadow: 0 14px 30px rgba(255, 216, 102, 0.24);
  background: radial-gradient(circle at 30% 0%, rgba(255, 216, 102, 0.25), rgba(35, 26, 16, 0.92));
}

.achievement-card--achieved .achievement-card__status-dot {
  background: linear-gradient(180deg, #ffd166, #ff9f1c);
}

.achievement-card--owned {
  border-color: rgba(160, 223, 180, 0.6);
  background: linear-gradient(180deg, rgba(38, 62, 48, 0.7), rgba(18, 24, 20, 0.9));
}

.achievement-card--owned .achievement-card__status-dot {
  background: linear-gradient(180deg, #8af7b0, #2dd373);
}

.title-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.title-row {
  display: grid;
  grid-template-columns: 84px 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(18, 18, 26, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(242, 236, 255, 0.88);
}

.title-row--achieved {
  border-color: rgba(255, 216, 102, 0.5);
  background: rgba(32, 26, 18, 0.8);
}

.title-row__status {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.68);
}

.title-row__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.title-row__title {
  font-weight: 800;
  font-size: 13px;
  color: #ffeec0;
}

.title-row__condition {
  font-size: 12px;
  color: rgba(230, 227, 240, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-row__progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-row__progress-label {
  font-size: 11px;
  color: rgba(200, 196, 214, 0.8);
}

.title-row__progress-bar {
  position: relative;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.title-row__progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, #7abaff, #a1c4ff);
  transition: width 200ms ease;
}

.title-row__point {
  font-size: 12px;
  font-weight: 700;
  color: rgba(214, 232, 255, 0.9);
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid rgba(122, 186, 255, 0.4);
  background: rgba(122, 186, 255, 0.12);
}

.achievement-overlay-enter-active,
.achievement-overlay-leave-active {
  transition: opacity 160ms ease;
}

.achievement-overlay-enter-from,
.achievement-overlay-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .achievement-window__tabs {
    padding: 10px 12px 0;
  }

  .achievement-window__body {
    padding: 12px;
  }

  .achievement-grid {
    grid-template-columns: 1fr;
  }

  .title-row {
    grid-template-columns: 72px 1fr;
    gap: 8px;
  }

  .title-row__point {
    grid-column: 2 / 3;
    justify-self: end;
  }
}
</style>
