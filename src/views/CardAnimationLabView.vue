<!--
CardAnimationLabView の責務:
- card-eliminate（砂化）演出とハンド移動手法（FLIP / ViewTransitions）を検証する。
- UI から砂化バリエーションを切り替え、実際の挙動を視覚的に確認できるようにする。

責務ではないこと:
- Battle や ViewManager への直接組み込み。ここで得た知見をどう取り込むかは別タスク。
-->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import ActionCard from '@/components/ActionCard.vue'
import { spawnCardAshOverlay } from '@/utils/cardAshOverlay'

const baseSkillCard = {
  id: 'lab-card',
  title: 'ポイズンリース',
  type: 'skill' as const,
  cost: 2,
  illustration: '🌿',
  description: '防御＋5\n次のターン、与ダメージ+3',
  primaryTags: [{ id: 'tag-type-skill', label: '補助' }],
  effectTags: [{ id: 'tag-buff', label: '防御' }],
  categoryTags: [{ id: 'tag-memory', label: '記憶' }],
  descriptionSegments: [],
  attackStyle: 'single' as const,
  damageAmount: 0,
  damageCount: 0,
}

type LabCardInfo = typeof baseSkillCard
type LabCard = { id: number; info: LabCardInfo }

const leaveCardVisible = ref(true)
const leaveCardInfo = computed<LabCardInfo>(() => baseSkillCard)

const playLeaveAnimation = () => {
  leaveCardVisible.value = !leaveCardVisible.value
}

const leaveTransitionName = 'card-ash'

const handleLeaveBefore = (el: Element) => {
  const rect = el.getBoundingClientRect()
  spawnCardAshOverlay(rect, {
    motionScale: 0.6,
    durationScale: 0.6,
    horizontalSpreadScale: 0.6,
    initialXRange: { min: 0.15, max: 0.85 },
    particleColor: 'rgba(255, 230, 150, 0.9)',
  })
}

// ---- Method A: FLIP ----
const flipCardCounter = ref(1)
const makeCard = (label: string): LabCard => {
  const id = flipCardCounter.value++
  return {
    id,
    info: {
      ...baseSkillCard,
      id: `${label}-${id}`,
      title: `${label} #${id}`,
    },
  }
}

const flipCard = ref<LabCard>(makeCard('FLIP'))
const flipLocation = ref<'spawn' | 'hand'>('spawn')
const flipCardRef = ref<HTMLElement | null>(null)
const flipAnimating = ref(false)

const moveFlipCard = async (target: 'spawn' | 'hand') => {
  if (flipLocation.value === target || flipAnimating.value) {
    return
  }
  const current = flipCardRef.value
  flipLocation.value = target
  if (!current) {
    await nextTick()
    return
  }
  flipAnimating.value = true
  const first = current.getBoundingClientRect()
  await nextTick()
  const nextEl = flipCardRef.value
  if (!nextEl) {
    flipAnimating.value = false
    return
  }
  const last = nextEl.getBoundingClientRect()
  const dx = first.left - last.left
  const dy = first.top - last.top
  const sx = first.width / last.width
  const sy = first.height / last.height
  nextEl.style.willChange = 'transform'
  nextEl.style.transformOrigin = 'top left'
  nextEl.style.transition = 'none'
  nextEl.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
  requestAnimationFrame(() => {
    nextEl.style.transition = 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)'
    nextEl.style.transform = 'translate(0, 0) scale(1, 1)'
  })
  const handleEnd = () => {
    nextEl.style.transition = ''
    nextEl.style.transform = ''
    nextEl.style.willChange = ''
    flipAnimating.value = false
    nextEl.removeEventListener('transitionend', handleEnd)
  }
  nextEl.addEventListener('transitionend', handleEnd)
}

const resetFlipCard = () => {
  flipCard.value = makeCard('FLIP')
  flipLocation.value = 'spawn'
}

// ---- Method B: ViewTransition ----
const viewTransitionSupported =
  typeof document !== 'undefined' && 'startViewTransition' in document
const viewCard = ref<LabCard>(makeCard('VT'))
const viewLocation = ref<'spawn' | 'hand'>('spawn')

const moveViewCard = async (target: 'spawn' | 'hand') => {
  if (viewLocation.value === target) {
    return
  }
  const update = () => {
    viewLocation.value = target
  }
  if (viewTransitionSupported && typeof document !== 'undefined') {
    try {
      const transition = (document as any).startViewTransition(update)
      await transition?.finished
    } catch {
      update()
    }
  } else {
    update()
  }
}

const resetViewCard = () => {
  viewLocation.value = 'spawn'
  viewCard.value = makeCard('VT')
}
</script>

<template>
  <main class="animation-lab">
    <header class="lab-intro">
      <h1>Card Animation Lab</h1>
      <p>card-eliminate の砂化アニメと、ハンド移動ロジック（FLIP / ViewTransition）を検証できます。</p>
    </header>

    <section class="lab-section">
      <h2>card-eliminate (Sand Ash)</h2>
      <p>下方向からマスクを押し上げ、粒子が前面に散る砂化アニメーションの挙動を確認できます。</p>
      <div class="button-row">
        <button type="button" class="lab-button" @click="playLeaveAnimation">
          {{ leaveCardVisible ? 'Play leave animation' : 'Reset card' }}
        </button>
        <button
          v-if="!leaveCardVisible"
          type="button"
          class="lab-button lab-button--ghost"
          @click="leaveCardVisible = true"
        >
          Reset
        </button>
      </div>
      <div class="lab-stage">
        <Transition :name="leaveTransitionName" mode="out-in" @before-leave="handleLeaveBefore">
          <ActionCard
            v-if="leaveCardVisible"
            key="leave-card"
            v-bind="leaveCardInfo"
            :operations="[]"
            :affordable="true"
          />
        </Transition>
      </div>
    </section>

    <section class="lab-section">
      <h2>方法A: FLIP (First–Last–Invert–Play)</h2>
      <p>DOM を移動させる前後座標の差分を `transform` で補正し、滑らかに位置を入れ替える手法です。</p>
      <div class="button-row">
        <button type="button" class="lab-button" @click="moveFlipCard('hand')" :disabled="flipLocation === 'hand'">
          中央 → 手札
        </button>
        <button type="button" class="lab-button" @click="moveFlipCard('spawn')" :disabled="flipLocation === 'spawn'">
          手札 → 中央
        </button>
        <button type="button" class="lab-button lab-button--ghost" @click="resetFlipCard">
          カードをリセット
        </button>
      </div>
      <div class="lab-flip-simulator">
        <div class="lab-flip-zone">
          <div class="lab-zone-label">生成エリア</div>
          <div v-if="flipLocation === 'spawn'" ref="flipCardRef" class="lab-demo-card">
            <ActionCard v-bind="flipCard.info" :operations="[]" :affordable="true" variant="frame" />
          </div>
        </div>
        <div class="lab-flip-zone">
          <div class="lab-zone-label">手札エリア</div>
          <div v-if="flipLocation === 'hand'" ref="flipCardRef" class="lab-demo-card">
            <ActionCard v-bind="flipCard.info" :operations="[]" :affordable="true" variant="frame" />
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section">
      <h2>方法B: View Transitions API</h2>
      <p>対応ブラウザでは View Transitions API を利用し、ブラウザ任せで DOM 移動を補間します。</p>
      <div class="button-row">
        <button type="button" class="lab-button" @click="moveViewCard('hand')" :disabled="viewLocation === 'hand'">
          中央 → 手札
        </button>
        <button type="button" class="lab-button" @click="moveViewCard('spawn')" :disabled="viewLocation === 'spawn'">
          手札 → 中央
        </button>
        <button type="button" class="lab-button lab-button--ghost" @click="resetViewCard">
          カードをリセット
        </button>
      </div>
      <p v-if="!viewTransitionSupported" class="lab-hint">
        お使いのブラウザは View Transitions API をサポートしていません（通常の切り替えとして再生します）。
      </p>
      <div class="lab-view-simulator">
        <div class="lab-view-zone">
          <div class="lab-zone-label">生成エリア</div>
          <div
            v-if="viewLocation === 'spawn'"
            class="lab-demo-card lab-view-card"
            style="view-transition-name: lab-vt-card;"
          >
            <ActionCard v-bind="viewCard.info" :operations="[]" :affordable="true" variant="frame" />
          </div>
        </div>
        <div class="lab-view-zone">
          <div class="lab-zone-label">手札エリア</div>
          <div
            v-if="viewLocation === 'hand'"
            class="lab-demo-card lab-view-card"
            style="view-transition-name: lab-vt-card;"
          >
            <ActionCard v-bind="viewCard.info" :operations="[]" :affordable="true" variant="frame" />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.animation-lab {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  color: #f6f0ff;
}

.lab-intro h1 {
  margin: 0 0 12px;
  font-size: 28px;
  letter-spacing: 0.08em;
}

.lab-intro p {
  margin: 0;
  color: rgba(246, 240, 255, 0.78);
  line-height: 1.6;
}

.lab-section {
  margin-top: 36px;
  padding: 24px;
  border-radius: 16px;
  background: rgba(10, 8, 16, 0.85);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

.lab-section h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

.mode-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.mode-switch label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.button-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.lab-button {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(36, 28, 52, 0.85);
  color: #fff1d8;
  cursor: pointer;
  letter-spacing: 0.08em;
}

.lab-button:hover {
  background: rgba(54, 40, 72, 0.9);
}

.lab-button--ghost {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.45);
}

.lab-button--ghost:hover {
  background: rgba(255, 255, 255, 0.08);
}

.lab-stage {
  margin-top: 24px;
  min-height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.lab-hint {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
}

.lab-flip-simulator,
.lab-view-simulator {
  margin-top: 24px;
  border-radius: 14px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.lab-flip-zone,
.lab-view-zone {
  min-height: 180px;
  border-radius: 12px;
  background: rgba(8, 6, 14, 0.65);
  border: 1px dashed rgba(255, 255, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.lab-zone-label {
  position: absolute;
  top: 8px;
  left: 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.lab-demo-card {
  width: 120px;
  height: 180px;
}

.lab-view-card {
  transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.card-ash-enter-from,
.card-ash-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.card-ash-enter-to,
.card-ash-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.card-ash-enter-active,
.card-ash-leave-active {
  transition: opacity 1000ms cubic-bezier(0.2, 0.9, 0.2, 1), transform 1000ms cubic-bezier(0.2, 0.9, 0.2, 1);
}

.card-ash-leave-active :deep(.action-card) {
  position: relative;
  overflow: visible;
  -webkit-mask-image: linear-gradient(to top, transparent 0 35%, #000 45% 100%);
  mask-image: linear-gradient(to top, transparent 0 35%, #000 45% 100%);
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-size: 100% 260%;
  mask-size: 100% 260%;
  -webkit-mask-position: 50% 0%;
  mask-position: 50% 0%;
  animation:
    card-ash-mask 1000ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards,
    card-ash-fade 1000ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
  will-change: mask-position, opacity, transform;
}

@keyframes card-ash-mask {
  0% {
    -webkit-mask-position: 50% 0%;
    mask-position: 50% 0%;
  }
  100% {
    -webkit-mask-position: 50% 120%;
    mask-position: 50% 120%;
  }
}

@keyframes card-ash-fade {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(2px);
  }
}

:global(.card-ash-overlay) {
  position: fixed;
  pointer-events: none;
  z-index: 10000;
  left: 0;
  top: 0;
}

:global(.card-ash-particle) {
  position: absolute;
  left: 0;
  top: 0;
  width: var(--p-size, 3px);
  height: var(--p-size, 3px);
  border-radius: 50%;
  background: rgba(235, 235, 235, 0.9);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
  filter: blur(0.4px);
  mix-blend-mode: screen;
  opacity: 0;
  transform: translate(var(--p-x, 0px), var(--p-y, 0px));
  animation: card-ash-particle var(--p-dur, 1000ms) ease-out var(--p-delay, 0ms) forwards;
  will-change: transform, opacity;
}

@keyframes card-ash-particle {
  0% {
    opacity: 0;
    transform: translate(var(--p-x, 0px), var(--p-y, 0px)) scale(1);
  }
  15% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(
        calc(var(--p-x, 0px) + var(--p-dx, 0px)),
        calc(var(--p-y, 0px) + var(--p-dy, -70px))
      )
      scale(0.9);
  }
}

::view-transition-old(lab-vt-card),
::view-transition-new(lab-vt-card) {
  animation: none;
  mix-blend-mode: normal;
}

@media (prefers-reduced-motion: reduce) {
  :global(.card-ash-enter-active),
  :global(.card-ash-leave-active) {
    transition-duration: 200ms !important;
    animation-duration: 200ms !important;
  }

  .lab-view-card,
  .lab-demo-card {
    transition-duration: 200ms !important;
  }
}
</style>
