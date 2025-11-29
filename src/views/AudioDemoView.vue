<!--
AudioDemoView の責務:
- AudioHub によるプリロード状態を確認し、ロード済みサウンド一覧を表示して再生テストを行う。
- ボタンでプリロード開始、一覧クリックで任意の音声を再生できるようにする。

主なインターフェース:
- AudioHub: preloadAll()/play() を利用して状態を確認する。
- SOUND_ASSETS: マニフェストから取得した音声リストを表示する。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { SOUND_ASSETS } from '@/assets/preloadManifest'
import { useAudioHub } from '@/composables/audioHub'

const audioHub = useAudioHub()
const log = ref<string[]>([])
const isPreloading = ref(false)

function appendLog(message: string): void {
  const timestamp = new Date().toLocaleTimeString()
  log.value = [...log.value.slice(-30), `[${timestamp}] ${message}`]
}

async function handlePreload(): Promise<void> {
  if (isPreloading.value) return
  isPreloading.value = true
  appendLog('プリロード開始')
  try {
    await audioHub.preloadAll()
    appendLog('プリロード完了')
  } catch (error) {
    appendLog(`プリロード失敗: ${error}`)
  } finally {
    isPreloading.value = false
  }
}

function handlePlay(src: string): void {
  audioHub.play(src)
  appendLog(`再生: ${src}`)
}

const ready = computed(() => audioHub.ready.value)
</script>

<template>
  <div class="audio-demo">
    <header class="audio-demo__header">
      <h1>Audio Demo</h1>
      <div class="status">
        <span>Ready: {{ ready }}</span>
        <button type="button" :disabled="isPreloading" @click="handlePreload">
          {{ isPreloading ? '読み込み中...' : 'プリロード開始' }}
        </button>
      </div>
    </header>
    <section class="audio-demo__list">
      <h3>サウンド一覧 ({{ SOUND_ASSETS.length }} 件)</h3>
      <ul>
        <li v-for="src in SOUND_ASSETS" :key="src">
          <button type="button" @click="handlePlay(src)">{{ src }}</button>
        </li>
      </ul>
    </section>
    <section class="audio-demo__log">
      <h3>ログ</h3>
      <pre>{{ log.join('\n') }}</pre>
    </section>
  </div>
</template>

<style scoped>
.audio-demo {
  padding: 24px clamp(16px, 4vw, 48px);
  color: #f5f2ff;
  background: radial-gradient(circle at top, rgba(34, 28, 63, 0.95), rgba(9, 9, 14, 0.95));
  min-height: 100vh;
  box-sizing: border-box;
}

.audio-demo__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.status {
  display: flex;
  gap: 8px;
  align-items: center;
}

button {
  background: rgba(255, 227, 115, 0.9);
  color: #2d1a0f;
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 700;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.audio-demo__list ul {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 6px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.audio-demo__list li button {
  width: 100%;
  text-align: left;
}

.audio-demo__log pre {
  background: rgba(0, 0, 0, 0.25);
  padding: 12px;
  border-radius: 8px;
  min-height: 120px;
  overflow: auto;
}
</style>
