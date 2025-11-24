<!--
  Component: CutInOverlay
  責務: 指定された画像をカットイン演出としてオーバーレイ表示し、play メソッドで簡潔に再生制御する。表示時間とアニメーション（enter/leave）を内部で完結させ、呼び出し側は play のみを意識すればよいようにする。
  非責務: 画像のプリロードや再生タイミングのゲームロジック判定は行わない。表示する画像の選択や play を呼ぶタイミングは親コンポーネントが制御する。
  主な通信相手とインターフェース:
    - 親コンポーネント: props.src(string) で表示する画像パスを受け取り、defineExpose({ play }) で公開する play(): void を呼び出して再生を開始する。必要に応じて alt 文言を props.alt で渡せる。親は再生回数やタイミングを管理し、本コンポーネントは演出の実行のみを担う。
-->
<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
  }>(),
  {
    alt: 'cut-in',
  },
)

const ENTER_DURATION_MS = 200
const HOLD_DURATION_MS = 400
const isVisible = ref(false)
let hideTimer: number | null = null
let preloadPromise: Promise<void> | null = null
const imageLoaded = ref(false)

function clearTimer(): void {
  if (hideTimer !== null) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

async function play(): Promise<void> {
  // 連打に備えて一度非表示に戻し、タイマーもリセットする
  clearTimer()
  if (isVisible.value) {
    isVisible.value = false
    await nextTick()
  }
  // 演出開始前に画像を確実にデコードし、毎回の読み込みを防ぐ
  await ensureImagePreloaded()
  isVisible.value = true
  hideTimer = window.setTimeout(() => {
    isVisible.value = false
    hideTimer = null
  }, ENTER_DURATION_MS + HOLD_DURATION_MS)
}

defineExpose({ play, imageLoaded })
onBeforeUnmount(() => clearTimer())

const resolvedSrc = computed(() => {
  // public 配下のパスを素直に受け取りつつ、先頭スラッシュ漏れを防ぐ
  if (props.src.startsWith('/')) {
    return props.src
  }
  return `/${props.src.replace(/^\/+/, '')}`
})

function ensureImagePreloaded(): Promise<void> {
  // 再生ごとにロード・デコードが走らないよう、一度だけプリロードして再利用する
  if (preloadPromise) {
    return preloadPromise
  }
  preloadPromise = new Promise<void>((resolve, reject) => {
    const img = new Image()
    img.src = resolvedSrc.value
    if (img.complete) {
      imageLoaded.value = true
      resolve()
      return
    }
    img.onload = () => {
      imageLoaded.value = true
      resolve()
    }
    img.onerror = (event) => {
      reject(event instanceof ErrorEvent ? event.error : event)
    }
  })
  return preloadPromise
}

onMounted(() => {
  // 初回表示前にプリロードを走らせ、ブラウザキャッシュを活かす
  ensureImagePreloaded().catch(() => {
    // デモ用途なのでプリロード失敗時も演出自体は継続する
  })
})
</script>

<template>
  <div class="cut-in-overlay">
    <Transition name="cut-in">
      <div v-show="isVisible" class="cut-in-overlay__backdrop">
        <img :src="resolvedSrc" :alt="alt" class="cut-in-overlay__image" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.cut-in-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.cut-in-overlay__backdrop {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.7));
  backdrop-filter: blur(1px);
  will-change: transform, opacity;
}

.cut-in-overlay__image {
  max-width: 82%;
  max-height: 82%;
  object-fit: contain;
  filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.7));
}

.cut-in-enter-active,
.cut-in-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.cut-in-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.cut-in-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.cut-in-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.cut-in-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}
</style>
