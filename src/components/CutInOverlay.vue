<!--
  Component: CutInOverlay
  責務: 指定された画像をカットイン演出としてオーバーレイ表示し、play メソッドで簡潔に再生制御する。表示時間とアニメーション（enter/leave）を内部で完結させ、呼び出し側は play のみを意識すればよいようにする。
  非責務: 画像のプリロード（ImageHub に委譲）や再生タイミングのゲームロジック判定は行わない。表示する画像の選択や play を呼ぶタイミングは親コンポーネントが制御する。
  主な通信相手とインターフェース:
    - 親コンポーネント: props.src(string) で表示する画像パスを受け取り、defineExpose({ play }) で公開する play(): void を呼び出して再生を開始する。必要に応じて alt 文言を props.alt で渡せる。親は再生回数やタイミングを管理し、本コンポーネントは演出の実行のみを担う。
-->
<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { useImageHub } from '@/composables/imageHub'

const props = withDefaults(
  defineProps<{
    src: string
    alt?: string
  }>(),
  {
    alt: 'cut-in',
  },
)

const imageHub = useImageHub()
const canvasRef = ref<HTMLCanvasElement | null>(null)
const ENTER_DURATION_MS = 200
const HOLD_DURATION_MS = 400
const isVisible = ref(false)
let hideTimer: number | null = null
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
  await drawCutIn()
  isVisible.value = true
  hideTimer = window.setTimeout(() => {
    isVisible.value = false
    hideTimer = null
  }, ENTER_DURATION_MS + HOLD_DURATION_MS)
}

defineExpose({ play, imageLoaded })
onBeforeUnmount(() => clearTimer())

async function drawCutIn(): Promise<void> {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  const img = imageHub.getElement(props.src)
  if (!img) return

  const draw = () => {
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
    const dw = img.width * scale
    const dh = img.height * scale
    const dx = (canvas.width - dw) / 2
    const dy = (canvas.height - dh) / 2
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, dx, dy, dw, dh)
    imageLoaded.value = true
  }

  if (img.complete) {
    draw()
  } else {
    img.onload = () => draw()
  }
}
</script>

<template>
  <div class="cut-in-overlay">
    <Transition name="cut-in">
      <div v-show="isVisible" class="cut-in-overlay__backdrop">
        <canvas ref="canvasRef" class="cut-in-overlay__canvas" width="960" height="720" :aria-label="alt"></canvas>
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

.cut-in-overlay__canvas {
  max-width: 82%;
  max-height: 82%;
  background: transparent;
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
