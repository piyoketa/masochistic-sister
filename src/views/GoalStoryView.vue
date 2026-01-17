<!--
GoalStoryView の責務:
- ゴール到達後のシナリオを数ブロック表示し、読み終えたタイミングで進行セーブを確定してタイトルへ戻す。
- シナリオ開始/終了の管理と、セーブに必要なストアからの情報取得を担当する。

責務ではないこと:
- シナリオテキストの描画やクリック進行（TextWindowOverlayLayer が担当）。
- セーブデータのバリデーションや永続化ロジック（runSaveStorage が担当）。

主な通信相手とインターフェース:
- scenarioStore: `setScenario(nodes)` でゴール用シナリオを登録し、`hasRemaining` の変化で終了を検知する。
- achievementProgressStore/runProgressStore: 進行状況を取得し、`setFieldCleared` でフィールドクリアを記録する。
- fieldStore: `markCurrentCleared` でゴールノードをクリア扱いにする。
- runSaveStorage: `saveRunSaveData` で進行セーブを保存する。
- router: 保存完了後にタイトルへ遷移する。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MainGameLayout from '@/components/battle/MainGameLayout.vue'
import { useScenarioStore, type ScenarioNode } from '@/stores/scenarioStore'
import { useAchievementProgressStore } from '@/stores/achievementProgressStore'
import { useRunProgressStore } from '@/stores/runProgressStore'
import { useFieldStore } from '@/stores/fieldStore'
import { saveRunSaveData } from '@/utils/runSaveStorage'

type GoalStoryProps = {
  fieldId?: string
}

const props = defineProps<GoalStoryProps>()

const router = useRouter()
const scenarioStore = useScenarioStore()
const achievementProgressStore = useAchievementProgressStore()
const runProgressStore = useRunProgressStore()
const fieldStore = useFieldStore()

achievementProgressStore.ensureInitialized()
runProgressStore.ensureInitialized()

const targetFieldId = computed(() => props.fieldId ?? fieldStore.field.id ?? 'first-field')
const saveError = ref<string | null>(null)
const saveInProgress = ref(false)
const scenarioStarted = ref(false)

const goalScenario: ScenarioNode[] = [
  {
    type: 'text',
    kind: 'narration',
    text: '最深部には、聖女をかたどった像があった。',
  },
  {
    type: 'text',
    kind: 'narration',
    text: '像に触れた瞬間、あなたの意識と記憶は像に吸い込まれていった。',
  }
]

async function finalizeGoal(): Promise<void> {
  if (saveInProgress.value) {
    return
  }
  saveInProgress.value = true
  saveError.value = null
  // 設計上の決定: ゴールで初めてフィールドクリアを確定し、進行セーブへ反映する。
  runProgressStore.setFieldCleared(targetFieldId.value, true)
  const result = saveRunSaveData({
    achievementProgress: achievementProgressStore.progress,
    clearedFieldIds: runProgressStore.exportClearedFieldIds(),
  })
  if (!result.success) {
    saveError.value = result.message
    saveInProgress.value = false
    return
  }
  fieldStore.markCurrentCleared()
  scenarioStore.clearScenario()
  await router.push({ name: 'top' })
}

function retrySave(): void {
  // 保存失敗時の再試行を明示的に許可する。
  void finalizeGoal()
}

onMounted(() => {
  // ゴール画面到達時に専用シナリオを差し替える。
  scenarioStore.setScenario(goalScenario)
  scenarioStarted.value = true
})

watch(
  () => scenarioStore.hasRemaining,
  (hasRemaining) => {
    // シナリオ読み終わり時に保存を開始する。
    if (!scenarioStarted.value || hasRemaining) {
      return
    }
    void finalizeGoal()
  },
)

onBeforeUnmount(() => {
  // 画面遷移時にシナリオが残留しないようにクリアする。
  scenarioStore.clearScenario()
})
</script>

<template>
  <MainGameLayout>
    <div class="goal-story">
      <div class="goal-card">
        <h1>ゴール</h1>
        <p>シナリオを読み終えると、進行状況が自動で保存されます。</p>
        <p v-if="saveInProgress" class="goal-note">保存中...</p>
        <div v-if="saveError" class="goal-error">
          <p>保存に失敗しました: {{ saveError }}</p>
          <button type="button" class="goal-button" @click="retrySave">もう一度保存する</button>
        </div>
      </div>
    </div>
  </MainGameLayout>
</template>

<style scoped>
.goal-story {
  padding: 24px clamp(20px, 5vw, 48px);
  color: #f5f2ff;
}

.goal-card {
  max-width: 720px;
  margin: 0 auto;
  padding: 28px clamp(20px, 4vw, 40px);
  background: rgba(12, 10, 20, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.4);
  line-height: 1.7;
}

.goal-card h1 {
  margin: 0 0 12px;
  letter-spacing: 0.2em;
}

.goal-note {
  margin-top: 12px;
  color: rgba(255, 214, 128, 0.9);
  font-weight: 600;
}

.goal-error {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(140, 40, 40, 0.25);
  border: 1px solid rgba(255, 122, 122, 0.4);
}

.goal-button {
  margin-top: 8px;
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(255, 227, 115, 0.95), rgba(255, 188, 82, 0.95));
  color: #2d1a0f;
  font-weight: 700;
  cursor: pointer;
}

.goal-button:hover,
.goal-button:focus-visible {
  filter: brightness(1.05);
}
</style>
