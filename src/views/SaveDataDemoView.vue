<!--
SaveDataDemoView の責務:
- 進行セーブデータの削除/保存、フィールドのクリア状態編集を行うデモ画面を提供する。
- セーブデータの内容サマリを表示し、現在の進行状態との違いを確認できるようにする。
責務ではないこと:
- バトルやフィールド進行の自動更新（ここでは手動編集のみ）。
- プレイヤーHPやデッキなど他システムの保存。
主な通信相手とインターフェース:
- runSaveStorage: `loadRunSaveData` / `saveRunSaveData` / `deleteRunSaveData` でセーブデータを管理する。
- achievementProgressStore: `progress` を読み取り、保存対象の実績進行として使う。
- runProgressStore: `setFieldCleared` / `exportClearedFieldIds` でフィールド進行を編集・保存する。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import GameLayout from '@/components/GameLayout.vue'
import { useAchievementProgressStore } from '@/stores/achievementProgressStore'
import { useAchievementStore } from '@/stores/achievementStore'
import { useRunProgressStore } from '@/stores/runProgressStore'
import { deleteRunSaveData, loadRunSaveData, saveRunSaveData, type RunSaveData } from '@/utils/runSaveStorage'
import { FIELD_LABELS, FIELD_ORDER } from '@/constants/fieldProgress'
import { useScenarioStore } from '@/stores/scenarioStore'

const achievementProgressStore = useAchievementProgressStore()
const achievementStore = useAchievementStore()
const runProgressStore = useRunProgressStore()
const scenarioStore = useScenarioStore()

achievementProgressStore.ensureInitialized()
achievementStore.ensureInitialized()
runProgressStore.ensureInitialized()

onMounted(() => {
  // デモ画面ではシナリオオーバーレイを閉じ、操作できる状態にする。
  scenarioStore.clearScenario()
})

const savedData = ref<RunSaveData | null>(loadRunSaveData())
const saveMessage = ref<string | null>(null)
const saveError = ref<string | null>(null)

const currentFieldStates = computed(() =>
  FIELD_ORDER.map((fieldId) => ({
    fieldId,
    label: FIELD_LABELS[fieldId],
    cleared: runProgressStore.isFieldCleared(fieldId),
  })),
)

const savedFieldStates = computed(() =>
  FIELD_ORDER.map((fieldId) => ({
    fieldId,
    label: FIELD_LABELS[fieldId],
    cleared: savedData.value?.clearedFieldIds.includes(fieldId) ?? false,
  })),
)

function refreshSavedData(): void {
  savedData.value = loadRunSaveData()
}

function handleToggleField(fieldId: string): void {
  // 現在の進行状態のみを更新し、保存ボタンでセーブデータへ反映する。
  const next = !runProgressStore.isFieldCleared(fieldId)
  runProgressStore.setFieldCleared(fieldId, next)
}

function handleSaveCurrent(): void {
  saveMessage.value = null
  saveError.value = null
  const result = saveRunSaveData({
    achievementProgress: achievementProgressStore.progress,
    clearedFieldIds: runProgressStore.exportClearedFieldIds(),
  })
  if (result.success) {
    saveMessage.value = result.message
    refreshSavedData()
  } else {
    saveError.value = result.message
  }
}

function handleDeleteSave(): void {
  deleteRunSaveData()
  refreshSavedData()
  saveMessage.value = 'セーブデータを削除しました'
  saveError.value = null
}

function handleResetCurrentProgress(): void {
  // 設計判断: /demo/save-data のリセットは「現在のストア状態」のみを初期化し、
  // 保存済みデータも同時に削除して完全初期化する。
  achievementStore.resetHistory()
  achievementProgressStore.resetForNewRun()
  runProgressStore.resetForNewRun()
  deleteRunSaveData()
  refreshSavedData()
  saveMessage.value = '現在の実績状態と保存済みデータをリセットしました'
  saveError.value = null
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
      <div class="save-demo">
        <header class="save-demo__header">
          <h1>セーブデータ編集デモ</h1>
          <p>実績進行とフィールド進行を手動で保存・編集するための簡易ページです。</p>
        </header>

        <section class="save-demo__panel">
          <h2>現在の進行状態</h2>
          <p class="save-demo__note">フィールドのクリア状態を切り替え、保存ボタンでセーブします。</p>
          <ul class="save-demo__field-list">
            <li v-for="field in currentFieldStates" :key="field.fieldId" class="save-demo__field">
              <div class="save-demo__field-info">
                <span class="save-demo__field-name">{{ field.label }}</span>
                <span class="save-demo__field-state" :class="{ cleared: field.cleared }">
                  {{ field.cleared ? 'クリア済み' : '未クリア' }}
                </span>
              </div>
              <button
                type="button"
                class="save-demo__toggle"
                @click="handleToggleField(field.fieldId)"
              >
                {{ field.cleared ? '未クリアに戻す' : 'クリア済みにする' }}
              </button>
            </li>
          </ul>

          <div class="save-demo__actions">
            <button type="button" class="save-demo__button" @click="handleSaveCurrent">
              現在の進行状態を保存
            </button>
            <button type="button" class="save-demo__button save-demo__button--ghost" @click="handleResetCurrentProgress">
              実績と進行状態をリセット
            </button>
            <button type="button" class="save-demo__button save-demo__button--ghost" @click="handleDeleteSave">
              セーブデータを削除
            </button>
            <p v-if="saveMessage" class="save-demo__message">{{ saveMessage }}</p>
            <p v-if="saveError" class="save-demo__error">{{ saveError }}</p>
          </div>
        </section>

        <section class="save-demo__panel save-demo__panel--sub">
          <h2>保存中のデータ</h2>
          <div v-if="savedData" class="save-demo__saved">
            <p class="save-demo__note">保存時刻: {{ formatSavedAt(savedData.savedAt) }}</p>
            <ul class="save-demo__field-list">
              <li v-for="field in savedFieldStates" :key="field.fieldId" class="save-demo__field">
                <span class="save-demo__field-name">{{ field.label }}</span>
                <span class="save-demo__field-state" :class="{ cleared: field.cleared }">
                  {{ field.cleared ? 'クリア済み' : '未クリア' }}
                </span>
              </li>
            </ul>
          </div>
          <p v-else class="save-demo__empty">セーブデータがありません。</p>
        </section>
      </div>
    </template>
  </GameLayout>
</template>

<style scoped>
.save-demo {
  --paper: #14131b;
  --ink: #f7f2e7;
  --accent: #f4a261;
  --accent-strong: #e76f51;
  --line: rgba(255, 255, 255, 0.14);
  --muted: rgba(247, 242, 231, 0.7);
  height: 100%;
  width: 100%;
  padding: clamp(20px, 4vw, 36px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background:
    radial-gradient(circle at top right, rgba(244, 162, 97, 0.2), transparent 55%),
    linear-gradient(150deg, #101018 0%, #1f161f 45%, #2a1d1c 100%);
  color: var(--ink);
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
}

.save-demo__header h1 {
  margin: 0 0 6px;
  letter-spacing: 0.18em;
  font-size: clamp(22px, 4vw, 32px);
}

.save-demo__header p {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.save-demo__panel {
  padding: 18px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: rgba(15, 12, 20, 0.82);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.save-demo__panel--sub {
  background: rgba(12, 10, 16, 0.7);
}

.save-demo__panel h2 {
  margin: 0;
  font-size: 16px;
  letter-spacing: 0.12em;
}

.save-demo__note {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.save-demo__field-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
}

.save-demo__field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px 12px;
  background: rgba(6, 6, 12, 0.65);
}

.save-demo__field-info {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 13px;
}

.save-demo__field-name {
  letter-spacing: 0.08em;
}

.save-demo__field-state {
  color: var(--muted);
}

.save-demo__field-state.cleared {
  color: var(--accent);
  font-weight: 700;
}

.save-demo__toggle {
  align-self: flex-start;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.06);
  color: var(--ink);
  padding: 6px 14px;
  font-size: 12px;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease;
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
}

.save-demo__toggle:hover,
.save-demo__toggle:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.35);
}

.save-demo__progress {
  font-size: 12px;
  color: var(--muted);
}

.save-demo__progress h3 {
  margin: 0 0 6px;
  font-size: 13px;
  letter-spacing: 0.1em;
  color: var(--ink);
}

.save-demo__progress ul {
  margin: 0;
  padding-left: 16px;
  display: grid;
  gap: 4px;
}

.save-demo__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.save-demo__button {
  border-radius: 999px;
  border: none;
  padding: 10px 18px;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #2d140a;
  font-weight: 700;
  letter-spacing: 0.12em;
  cursor: pointer;
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.save-demo__button--ghost {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--line);
  color: var(--ink);
  box-shadow: none;
}

.save-demo__button:hover,
.save-demo__button:focus-visible {
  transform: translateY(-1px);
}

.save-demo__message {
  margin: 0;
  font-size: 12px;
  color: var(--accent);
}

.save-demo__error {
  margin: 0;
  font-size: 12px;
  color: #ffb4c1;
}

.save-demo__saved {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.save-demo__empty {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}
@media (max-width: 768px) {
  .save-demo {
    gap: 14px;
  }
}
</style>
