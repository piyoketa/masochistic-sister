<!--
Componentの責務: 実績一覧をモーダルで提示し、ステータスごとに見た目を変えたカードと報酬ボタン（クリックイベントを親へ通知）を表示する。記憶ポイント残高の表示と、閉じる操作も提供する。
責務ではないこと: 実績の進行計算や報酬受取の処理。クリック時の状態遷移・バリデーションは親側のストアで担う前提で、ここでは純粋に見た目とイベント通知だけを担う。
主な通信相手: 親コンポーネント（FieldView など）。props で visible/achievements/memoryPoints を受け取り、close/claim イベントでモーダル閉じ要求と「報酬を受け取る」操作を返す。AchievementStore などの状態管理は親で扱う。
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { AchievementStatus } from '@/stores/achievementStore'

export type AchievementCardView = {
  id: string
  title: string
  description: string
  rewardLabel: string
  status: AchievementStatus
  progressLabel?: string
  progressRatio?: number
  costLabel?: string
  actionable?: boolean
}

const props = defineProps<{
  visible: boolean
  achievements: AchievementCardView[]
  memoryPoints: number
}>()

const emit = defineEmits<{
  (event: 'close'): void
  (event: 'claim', payload: { id: string }): void
}>()

// UI レイヤーでだけ使う表示用ラベル。進行ロジックはまだ無いことを明示する。
const statusLabels: Record<AchievementStatus, string> = {
  'not-achieved': '未達成',
  'just-achieved': '達成直後',
  owned: '獲得済み',
  reacquirable: '再取得可能',
}

const statusVariants: Record<AchievementStatus, string> = {
  'not-achieved': 'achievement-card--not-achieved',
  'just-achieved': 'achievement-card--just-achieved',
  owned: 'achievement-card--owned',
  reacquirable: 'achievement-card--reacquirable',
}

const actionableStatuses = computed(() => new Set<AchievementStatus>(['just-achieved', 'reacquirable']))

function actionLabel(status: AchievementStatus): string {
  if (status === 'just-achieved') {
    return '報酬を受け取る'
  }
  if (status === 'reacquirable') {
    return '再取得する'
  }
  if (status === 'owned') {
    return '所持中'
  }
  return '未達成'
}

function isActionDisabled(status: AchievementStatus): boolean {
  // まだロジックを持たないため、未達成/所持中はクリック不可にして誤操作を防ぐ。
  return !actionableStatuses.value.has(status)
}

function isEntryActionDisabled(entry: AchievementCardView): boolean {
  if (entry.actionable === false) {
    return true
  }
  return isActionDisabled(entry.status)
}

function progressWidth(ratio?: number): string {
  const safe = Math.min(Math.max(ratio ?? 0, 0), 1)
  return `${safe * 100}%`
}

function handleAction(entry: AchievementCardView): void {
  if (isEntryActionDisabled(entry)) {
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
              <div class="achievement-window__subtitle">今は見た目のみ。ロジック実装前のプレビューです。</div>
            </div>
          </div>
          <div class="achievement-window__controls">
            <div class="achievement-window__balance" aria-label="記憶ポイント残高">
              記憶ポイント {{ memoryPoints }} pt
            </div>
            <button type="button" class="achievement-window__close" aria-label="閉じる" @click="emit('close')">
              ×
            </button>
          </div>
        </header>

        <div class="achievement-window__body">
          <div class="achievement-grid">
            <article
              v-for="entry in achievements"
              :key="entry.id"
              class="achievement-card"
              :class="statusVariants[entry.status]"
            >
              <div class="achievement-card__status">
                <span class="achievement-card__status-dot" />
                {{ statusLabels[entry.status] }}
              </div>
              <div class="achievement-card__title">{{ entry.title }}</div>
              <p class="achievement-card__description">{{ entry.description }}</p>

              <div v-if="entry.progressLabel" class="achievement-card__progress">
                <div class="achievement-card__progress-label">進行: {{ entry.progressLabel }}</div>
                <div class="achievement-card__progress-bar">
                  <span class="achievement-card__progress-fill" :style="{ width: progressWidth(entry.progressRatio) }" />
                </div>
              </div>

              <div class="achievement-card__reward">
                <span class="achievement-card__reward-chip">報酬</span>
                <span class="achievement-card__reward-text">{{ entry.rewardLabel }}</span>
                <span v-if="entry.costLabel" class="achievement-card__cost">{{ entry.costLabel }}</span>
              </div>

              <div class="achievement-card__footer">
                <span class="achievement-card__status-label">{{ statusLabels[entry.status] }}</span>
                <button
                  type="button"
                  class="achievement-card__action"
                  :disabled="isEntryActionDisabled(entry)"
                  @click="handleAction(entry)"
                >
                  {{ actionLabel(entry.status) }}
                </button>
              </div>
            </article>
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

.achievement-window__balance {
  padding: 8px 12px;
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(138, 196, 255, 0.2), rgba(90, 138, 255, 0.15));
  color: #dceaff;
  font-weight: 700;
  letter-spacing: 0.04em;
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

.achievement-window__body {
  padding: 16px 16px 18px;
  overflow-y: auto; /* カード数が20枚以上でもスクロールで全件確認できるようにする */
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

.achievement-card__action:hover:not(:disabled),
.achievement-card__action:focus-visible:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.35);
  background: rgba(255, 227, 115, 0.28);
  border-color: rgba(255, 227, 115, 0.7);
}

.achievement-card__action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.achievement-card--not-achieved {
  border-color: rgba(255, 255, 255, 0.08);
}

.achievement-card--not-achieved .achievement-card__status-dot {
  background: #7a7f92;
}

.achievement-card--just-achieved {
  border-color: rgba(255, 216, 102, 0.8);
  box-shadow: 0 14px 30px rgba(255, 216, 102, 0.24);
  background: radial-gradient(circle at 30% 0%, rgba(255, 216, 102, 0.25), rgba(35, 26, 16, 0.92));
}

.achievement-card--just-achieved .achievement-card__status-dot {
  background: linear-gradient(180deg, #ffd166, #ff9f1c);
}

.achievement-card--owned {
  border-color: rgba(160, 223, 180, 0.6);
  background: linear-gradient(180deg, rgba(38, 62, 48, 0.7), rgba(18, 24, 20, 0.9));
}

.achievement-card--owned .achievement-card__status-dot {
  background: linear-gradient(180deg, #8af7b0, #2dd373);
}

.achievement-card--owned .achievement-card__action {
  background: rgba(138, 247, 176, 0.12);
  border-color: rgba(138, 247, 176, 0.45);
  color: #cbffd8;
}

.achievement-card--reacquirable {
  border-color: rgba(122, 186, 255, 0.7);
  background: linear-gradient(180deg, rgba(38, 50, 68, 0.72), rgba(18, 20, 26, 0.92));
  box-shadow: 0 14px 28px rgba(122, 186, 255, 0.18);
}

.achievement-card--reacquirable .achievement-card__status-dot {
  background: linear-gradient(180deg, #7abaff, #4d7fc1);
}

.achievement-overlay-enter-active,
.achievement-overlay-leave-active {
  transition: opacity 160ms ease;
}

.achievement-overlay-enter-from,
.achievement-overlay-leave-to {
  opacity: 0;
}
</style>
