<!--
StartStoryView の責務:
- スタートマスで表示される導入ストーリーをシンプルなHTMLで描画し、進むボタンでフィールドに戻す。
- 共通レイアウト MainGameLayout を利用しつつ、ストーリー本文はテンプレート内で直接記述する。
- フィールドIDをクエリ/propsで受け取り、対応するフィールドを初期化した上で遷移する（フィールド切替にも対応）。
-->
<script setup lang="ts">
import { useRouter } from 'vue-router'
import MainGameLayout from '@/components/battle/MainGameLayout.vue'
import { useFieldStore } from '@/stores/fieldStore'
import { usePlayerStore } from '@/stores/playerStore'
import { computed, onMounted } from 'vue'

type StartStoryProps = {
  fieldId?: string
}

const props = defineProps<StartStoryProps>()

const router = useRouter()
const fieldStore = useFieldStore()
const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const targetFieldId = computed(() => props.fieldId ?? 'first-field')

onMounted(() => {
  // フィールド開始時に指定されたフィールドを初期化する（別フィールド導線にも対応）
  if (fieldStore.field.id !== targetFieldId.value) {
    fieldStore.initializeField(targetFieldId.value)
  }
})

async function handleFinish(): Promise<void> {
  // スタートマスをクリア扱いにし、進行を正しく更新する
  fieldStore.markCurrentCleared()
  // ストーリー終了後はフィールドに戻す。フィールドは既定の状態を保持する。
  const nextPath = targetFieldId.value === 'second-field' ? '/field/second' : '/field'
  await router.push(nextPath)
}
</script>

<template>
  <MainGameLayout>
    <div class="start-story">
      <div class="story-card">
        <p>
          これは古より続くそなたの運命<br>
        </p>
        <p>
          当代の“記憶の聖女"よ<br>
          成人を迎える日、"魔窟"の最深部を目指して旅立たん
        </p>
        <div class="story-visual">
          <img src="/assets/pages/start-story.png" alt="スタートストーリー" />
        </div>
        <button type="button" class="story-button" @click="handleFinish">
          魔窟に入る
        </button>
      </div>
    </div>
  </MainGameLayout>
</template>

<style scoped>
.start-story {
  padding: 24px clamp(20px, 5vw, 48px);
  color: #f5f2ff;
}

.story-card {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px clamp(20px, 4vw, 36px);
  background: rgba(16, 14, 24, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  line-height: 1.7;
  font-size: 16px;
}

.story-card p {
  margin: 0 0 14px;
}

.story-visual {
  margin: 12px 0 16px;
  text-align: center;
}

.story-visual img {
  max-width: 100%;
  border-radius: 12px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
}

.story-button {
  margin-top: 12px;
  padding: 10px 16px;
  background: linear-gradient(90deg, rgba(255, 227, 115, 0.95), rgba(255, 188, 82, 0.95));
  color: #2d1a0f;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

.story-button:hover,
.story-button:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.35);
}
</style>
