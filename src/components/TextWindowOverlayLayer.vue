<!--
TextWindowOverlayLayer の責務:
- ScenarioStore が保持する現在のテキストノードを、シナリオ用のテキストウィンドウとして表示する。
- 画面全体のオーバーレイを張り、ウィンドウ外クリックで次のノードへ進める。

責務ではないこと:
- シナリオの進行ロジック自体の管理（順番や内容の保持は ScenarioStore に委譲）。
- 音楽や画像など、テキスト以外のシナリオ演出の実装。

主な通信相手とインターフェース:
- ScenarioStore と通信し、currentNode / hasRemaining を参照し advance() を呼ぶ。
  - currentNode: ScenarioNode (現状は ScenarioTextNode のみ) を取得し表示内容へ変換する。
  - advance(): クリック時に次のノードへ進行する。
  - hasRemaining: 残りがある場合のみ表示を継続する。
- GameLayout が提供する .game-window 要素を参照し、表示範囲をその矩形に揃える。
  - DOM の getBoundingClientRect を参照し、オーバーレイのサイズと位置を決定する。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { renderRichText } from '@/utils/richText'
import { useScenarioStore, type ScenarioTextNode } from '@/stores/scenarioStore'

const scenarioStore = useScenarioStore()
const overlayRect = ref({ top: 0, left: 0, width: 0, height: 0 })
let resizeObserver: ResizeObserver | null = null
let rafId: number | null = null

const currentTextNode = computed<ScenarioTextNode | null>(() => {
  const node = scenarioStore.currentNode
  if (!node || node.type !== 'text') {
    return null
  }
  return node
})

const isSpeech = computed(() => currentTextNode.value?.kind === 'speech')
const speakerName = computed(() => (currentTextNode.value?.kind === 'speech' ? currentTextNode.value.speaker : ''))
const bodyText = computed(() => currentTextNode.value?.text ?? '')
const bodyHtml = computed(() => {
  // HTML風タグは renderRichText で変換し、直接 HTML を流し込まない設計にする。
  return renderRichText(bodyText.value)
})
const bodyClass = computed(() =>
  currentTextNode.value?.kind === 'speech'
    ? 'text-window-overlay__body--speech'
    : 'text-window-overlay__body--narration',
)

const overlayStyle = computed(() => ({
  top: `${overlayRect.value.top}px`,
  left: `${overlayRect.value.left}px`,
  width: `${overlayRect.value.width}px`,
  height: `${overlayRect.value.height}px`,
}))

function resolveGameWindow(): HTMLElement | null {
  // GameLayout の描画領域に合わせてオーバーレイを重ねるための参照元。
  return document.querySelector<HTMLElement>('.game-window')
}

function updateOverlayRect(): void {
  const target = resolveGameWindow()
  if (!target) {
    // 参照先が見つからない場合は、操作不能を避けるため画面全体にフォールバックする。
    overlayRect.value = {
      top: 0,
      left: 0,
      width: window.innerWidth,
      height: window.innerHeight,
    }
    return
  }
  const rect = target.getBoundingClientRect()
  overlayRect.value = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

function scheduleOverlayUpdate(): void {
  // resize/scroll が連続した時に計算をまとめるため requestAnimationFrame を使う。
  if (rafId !== null) return
  rafId = window.requestAnimationFrame(() => {
    rafId = null
    updateOverlayRect()
  })
}

function handleAdvance(): void {
  // 表示中のノードがある時だけ進行させ、空クリックでの副作用を避ける。
  if (!scenarioStore.hasRemaining) return
  scenarioStore.advance()
}

onMounted(() => {
  updateOverlayRect()
  const target = resolveGameWindow()
  if (target && 'ResizeObserver' in window) {
    // GameLayout のサイズ変更に追従してオーバーレイを一致させるための監視。
    resizeObserver = new ResizeObserver(() => {
      scheduleOverlayUpdate()
    })
    resizeObserver.observe(target)
  }
  window.addEventListener('resize', scheduleOverlayUpdate)
  window.addEventListener('scroll', scheduleOverlayUpdate, { passive: true })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId)
    rafId = null
  }
  window.removeEventListener('resize', scheduleOverlayUpdate)
  window.removeEventListener('scroll', scheduleOverlayUpdate)
})
</script>

<template>
  <teleport to="body">
    <div v-if="scenarioStore.hasRemaining" class="text-window-overlay" :style="overlayStyle" @click="handleAdvance">
      <div class="text-window-overlay__scrim"></div>
      <div class="text-window-overlay__block" @click.stop>
        <div v-if="isSpeech" class="text-window-overlay__speaker">{{ speakerName }}</div>
        <div class="text-window-overlay__window">
          <div class="text-window-overlay__body" :class="bodyClass" v-html="bodyHtml"></div>
          <div class="text-window-overlay__hint">クリックで次へ</div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style>
.text-window-overlay {
  position: fixed;
  z-index: 900;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 24px 26px;
  box-sizing: border-box;
  cursor: pointer;
}

.text-window-overlay__scrim {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(88, 68, 140, 0.25), transparent 45%),
    radial-gradient(circle at 80% 10%, rgba(180, 92, 92, 0.2), transparent 40%),
    rgba(6, 6, 12, 0.65);
  pointer-events: none;
}

.text-window-overlay__block {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  pointer-events: auto;
  cursor: default;
  width: 860px;
  max-width: calc(100% - 32px);
}

.text-window-overlay__window {
  position: relative;
  width: 860px;
  height: 118px;
  padding: 14px 18px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: linear-gradient(135deg, rgba(16, 14, 24, 0.94), rgba(24, 12, 24, 0.9));
  box-shadow: 0 18px 36px rgba(0, 0, 0, 0.45);
  color: rgba(246, 241, 255, 0.96);
  backdrop-filter: blur(8px);
}

.text-window-overlay__speaker {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 700;
  color: rgba(255, 214, 128, 0.92);
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(12, 10, 18, 0.85);
  border: 1px solid rgba(255, 214, 128, 0.35);
  white-space: nowrap;
}

.text-window-overlay__body {
  font-size: 16px;
  line-height: 1.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.text-window-overlay__body--narration {
  color: rgba(242, 238, 255, 0.88);
}

.text-window-overlay__body--speech {
  color: rgba(255, 247, 235, 0.95);
}

.text-window-overlay__hint {
  margin-top: 8px;
  font-size: 12px;
  letter-spacing: 0.12em;
  color: rgba(230, 226, 255, 0.6);
  text-align: right;
}

@media (max-width: 960px) {
  .text-window-overlay__block,
  .text-window-overlay__window {
    width: 720px;
  }
}

@media (max-width: 820px) {
  .text-window-overlay__block,
  .text-window-overlay__window {
    width: 90%;
  }
}

@media (max-width: 600px) {
  .text-window-overlay__window {
    height: 108px;
    padding: 12px 14px 10px;
  }
  .text-window-overlay__body {
    font-size: 14px;
  }
}
</style>
