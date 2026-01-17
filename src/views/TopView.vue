<!--
TopView の責務:
- ルート(/)でタイトル画面と「はじめる」「つづきから」の導線を提示する。
- つづきから選択時にセーブデータの概要を表示し、開始操作で次の未クリアフィールドへ遷移する。
責務ではないこと:
- セーブデータの編集・更新（保存/削除はデモページに委譲）。
- フィールド内の進行計算やバトル起動。
主な通信相手とインターフェース:
- Router: `router.push` で StartStoryView / FieldView へ遷移する。
- achievementProgressStore: `resetForNewRun` / `replaceProgress` で実績進行を初期化/復元する。
- runProgressStore: `resetForNewRun` / `replaceClearedFieldIds` でフィールドクリア状況を初期化/復元する。
- fieldStore: `initializeField` でフィールドの内部進行状態をリセットする。
- runSaveStorage: `loadRunSaveData` でセーブデータ(RunSaveData: achievementProgress, clearedFieldIds, savedAt)を読む。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameLayout from '@/components/GameLayout.vue'
import { useAchievementProgressStore } from '@/stores/achievementProgressStore'
import { useRunProgressStore } from '@/stores/runProgressStore'
import { useFieldStore } from '@/stores/fieldStore'
import { usePlayerStore } from '@/stores/playerStore'
import { loadRunSaveData, type RunSaveData } from '@/utils/runSaveStorage'
import { FIELD_LABELS, FIELD_ORDER, findNextFieldId, resolveFieldPath } from '@/constants/fieldProgress'

const router = useRouter()
const achievementProgressStore = useAchievementProgressStore()
const runProgressStore = useRunProgressStore()
const fieldStore = useFieldStore()
const playerStore = usePlayerStore()

achievementProgressStore.ensureInitialized()
runProgressStore.ensureInitialized()

const continuePanelOpen = ref(false)
const continueNotice = ref<string | null>(null)
const saveData = ref<RunSaveData | null>(loadRunSaveData())

const hasSaveData = computed(() => saveData.value !== null)
const nextFieldId = computed(() =>
  saveData.value ? findNextFieldId(saveData.value.clearedFieldIds) : null,
)
const hasAllFieldsCleared = computed(() => hasSaveData.value && nextFieldId.value === null)
const nextFieldLabel = computed(() => (nextFieldId.value ? FIELD_LABELS[nextFieldId.value] : null))
const savedAtLabel = computed(() =>
  saveData.value ? formatSavedAt(saveData.value.savedAt) : '---',
)
const savedFieldStates = computed(() =>
  FIELD_ORDER.map((fieldId) => ({
    fieldId,
    label: FIELD_LABELS[fieldId],
    cleared: saveData.value?.clearedFieldIds.includes(fieldId) ?? false,
  })),
)

function refreshSaveData(): void {
  // 続きからパネルを開いたタイミングで、最新のセーブ状態を再取得する。
  saveData.value = loadRunSaveData()
}

function handleStartNew(): void {
  // 新規開始時はセーブデータを読まず、進行状況を完全リセットする。
  achievementProgressStore.resetForNewRun()
  runProgressStore.resetForNewRun()
  // セーブ対象外のノード進行は復元できないため、フィールド内部も必ず初期化する。
  fieldStore.initializeField('first-field')
  void router.push({ name: 'start-story', query: { fieldId: 'first-field' } })
}

function handleShowContinue(): void {
  continueNotice.value = null
  continuePanelOpen.value = true
  refreshSaveData()
}

function handleStartContinue(): void {
  refreshSaveData()
  if (!saveData.value) {
    continueNotice.value = 'セーブデータが見つかりませんでした。'
    return
  }
  // セーブデータをストアに反映してから、次の未クリアフィールドへ移動する。
  achievementProgressStore.replaceProgress(saveData.value.achievementProgress)
  runProgressStore.replaceClearedFieldIds(saveData.value.clearedFieldIds)
  const nextField = findNextFieldId(saveData.value.clearedFieldIds)
  if (!nextField) {
    continueNotice.value = 'すべてのフィールドがクリア済みです。'
    return
  }
  // つづきから開始時は、プレイヤーのデッキとHPを初期化してから進行を再開する。
  playerStore.resetDeckAndHpForContinue()
  // セーブ対象外のノード進行は復元できないため、フィールド内部を初期化してから遷移する。
  fieldStore.initializeField(nextField)
  void router.push(resolveFieldPath(nextField))
}

function formatSavedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <GameLayout>
    <template #window>
      <div class="top-view">
        <div class="top-hero">
          <p class="eyebrow">Memory of the Wound</p>
          <h1>被虐のシスター</h1>
          <p class="tagline">敵の攻撃の「記憶」をデッキにして戦え。</p>
        </div>

        <div class="top-actions">
          <button type="button" class="top-button top-button--primary" @click="handleStartNew">
            はじめる
          </button>
          <button
            type="button"
            class="top-button top-button--ghost"
            :disabled="!hasSaveData"
            @click="handleShowContinue"
          >
            つづきから
          </button>
          <p v-if="!hasSaveData" class="top-note">セーブデータがないため「つづきから」は利用できません。</p>
        </div>

        <transition name="continue-panel">
          <section v-if="continuePanelOpen" class="continue-panel">
            <header class="continue-header">
              <div>
                <h2>セーブデータ</h2>
                <p class="continue-subtitle">保存時刻: {{ savedAtLabel }}</p>
              </div>
              <span v-if="nextFieldLabel" class="continue-chip">次のフィールド: {{ nextFieldLabel }}</span>
            </header>

            <div class="continue-actions">
              <button
                type="button"
                class="top-button top-button--primary"
                :disabled="!saveData || hasAllFieldsCleared"
                @click="handleStartContinue"
              >
                開始
              </button>
              <button
                v-if="hasAllFieldsCleared"
                type="button"
                class="top-button top-button--ghost"
                @click="handleStartNew"
              >
                はじめる
              </button>
              <p v-if="continueNotice" class="continue-note">{{ continueNotice }}</p>
            </div>
          </section>
        </transition>
      </div>
    </template>

    <template #instructions>
      <div class="top-instructions">
        <p>「はじめる」で新規ランを開始し、ストーリー導入へ進みます。</p>
        <p>「つづきから」はセーブデータを確認した上で開始できる、デモ用の導線です。</p>
      </div>
    </template>
  </GameLayout>
</template>

<style scoped>
.top-view {
  --paper: #141016;
  --ink: #f7efe6;
  --accent: #ffcc6b;
  --accent-strong: #ff8f57;
  --muted: rgba(247, 239, 230, 0.72);
  --line: rgba(255, 255, 255, 0.12);
  height: 100%;
  width: 100%;
  padding: clamp(24px, 5vw, 40px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 28px;
  background:
    radial-gradient(circle at top, rgba(255, 140, 60, 0.18), transparent 55%),
    radial-gradient(circle at 20% 20%, rgba(255, 210, 120, 0.2), transparent 45%),
    linear-gradient(135deg, #0b0b12, #1a1118 45%, #2a1518);
  color: var(--ink);
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  position: relative;
  overflow: hidden;
}

.top-view::after {
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

.top-hero {
  position: relative;
  z-index: 1;
  text-align: left;
  animation: heroReveal 500ms ease-out;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.4em;
  text-transform: uppercase;
  color: var(--muted);
}

.top-hero h1 {
  margin: 0 0 12px;
  font-size: clamp(36px, 6vw, 64px);
  letter-spacing: 0.22em;
  text-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
}

.tagline {
  margin: 0;
  font-size: 16px;
  color: var(--muted);
  letter-spacing: 0.08em;
}

.top-actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 320px;
  animation: fadeSlide 520ms ease-out 80ms both;
}

.top-button {
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 12px 20px;
  font-size: 15px;
  letter-spacing: 0.2em;
  font-weight: 700;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
}

.top-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.top-button--primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #2b140a;
  box-shadow: 0 14px 30px rgba(255, 139, 80, 0.35);
}

.top-button--ghost {
  background: rgba(255, 255, 255, 0.06);
  color: var(--ink);
  border-color: var(--line);
}

.top-button:not(:disabled):hover,
.top-button:not(:disabled):focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.35);
}

.top-note {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--muted);
}

.continue-panel {
  position: relative;
  z-index: 1;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(10, 8, 14, 0.75);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.continue-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.continue-header h2 {
  margin: 0;
  font-size: 20px;
  letter-spacing: 0.12em;
}

.continue-subtitle {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.continue-chip {
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 204, 107, 0.2);
  border: 1px solid rgba(255, 204, 107, 0.45);
  font-size: 12px;
  letter-spacing: 0.08em;
}

.continue-chip--complete {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.continue-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.continue-section h3 {
  margin: 0 0 8px;
  font-size: 14px;
  letter-spacing: 0.12em;
}

.field-status-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.field-status {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
}

.field-state {
  color: var(--muted);
}

.field-state.cleared {
  color: var(--accent);
  font-weight: 700;
}

.progress-grid {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
  font-size: 12px;
  color: var(--muted);
}

.continue-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.continue-note {
  margin: 0;
  font-size: 12px;
  color: var(--accent);
}

.continue-empty {
  padding: 16px;
  border-radius: 12px;
  border: 1px dashed var(--line);
  color: var(--muted);
  font-size: 13px;
}

.top-instructions {
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  color: #20130b;
  background: linear-gradient(135deg, rgba(255, 244, 228, 0.8), rgba(255, 229, 209, 0.8));
  border-radius: 14px;
  padding: 16px 18px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.top-instructions p {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.06em;
}

.continue-panel-enter-active,
.continue-panel-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.continue-panel-enter-from,
.continue-panel-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@keyframes heroReveal {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeSlide {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .top-actions {
    max-width: 100%;
  }

  .continue-body {
    grid-template-columns: 1fr;
  }
}
</style>
