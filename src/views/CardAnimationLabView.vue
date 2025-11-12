<!--
CardAnimationLabView の責務:
- card-create / card-eliminate ワイプアニメーションを手軽に検証する実験ページを提供し、ActionCard の enter/leave 演出を単独で評価できるようにする。
- それぞれのトリガーボタンを持ち、カードの生成・消滅を Transition で制御する。

責務ではないこと:
- Battle や ViewManager への組み込み。実験で得た知見をどう本番へ反映するかの判断は別タスクとする。

主な通信相手:
- ActionCard: 実際に表示するカードコンポーネント。固定データを渡し、操作やダメージ計算は行わない。
-->
<script setup lang="ts">
import { nextTick, ref } from 'vue'
import ActionCard from '@/components/ActionCard.vue'

const sampleCard = {
  id: 'lab-card',
  title: 'ポイズンリース',
  type: 'skill',
  cost: 2,
  illustration: '🌿',
  description: '防御＋5\n次のターン、与ダメージ+3',
  descriptionSegments: [
    { text: '🌀守りの花びら(2)', tooltip: 'ターン開始時にシールド(2)を得る' },
    { text: '\n' },
    { text: '🌀毒の香り', tooltip: '攻撃時に敵へ毒(2)を付与する' },
  ],
  attackStyle: 'single',
  primaryTags: [{ id: 'tag-type-skill', label: '補助' }],
  effectTags: [{ id: 'tag-buff', label: '防御' }],
  categoryTags: [{ id: 'tag-memory', label: '記憶' }],
  damageAmount: 0,
  damageCount: 0,
}

const enterCardVisible = ref(false)
const leaveCardVisible = ref(true)
const leaveAnimationMode = ref<'circle' | 'spiral'>('circle')
const enterAnimationMode = ref<'spawn' | 'reveal' | 'flip' | 'spark'>('spawn')

const playEnterAnimation = async () => {
  enterCardVisible.value = false
  await nextTick()
  requestAnimationFrame(() => {
    enterCardVisible.value = true
  })
}

const playLeaveAnimation = () => {
  leaveCardVisible.value = !leaveCardVisible.value
}
</script>

<template>
  <main class="animation-lab">
    <header class="lab-intro">
      <h1>Card Animation Lab</h1>
      <p>card-create / card-eliminate を想定した円形ワイプアニメーションを検証するページです。</p>
    </header>

    <section class="lab-section">
      <h2>Enter Animation (card-create)</h2>
      <p>生成アニメーションを選択して再生できます（Materialize / Reveal / 3D Flip / Spark）。</p>
      <div class="mode-switch">
        <label>
          <input v-model="enterAnimationMode" type="radio" value="spawn" />
          Materialize
        </label>
        <label>
          <input v-model="enterAnimationMode" type="radio" value="reveal" />
          Reveal
        </label>
        <label>
          <input v-model="enterAnimationMode" type="radio" value="flip" />
          3D Flip
        </label>
        <label>
          <input v-model="enterAnimationMode" type="radio" value="spark" />
          Spark
        </label>
      </div>
      <div class="button-row">
        <button type="button" class="lab-button" @click="playEnterAnimation">Play enter animation</button>
        <button type="button" class="lab-button lab-button--ghost" @click="enterCardVisible = false">
          Reset
        </button>
      </div>
      <div class="lab-stage">
        <Transition :name="`enter-${enterAnimationMode}`" mode="out-in">
          <ActionCard
            v-if="enterCardVisible"
            key="enter-card"
            v-bind="sampleCard"
            :operations="[]"
            :affordable="true"
          />
        </Transition>
      </div>
    </section>

    <section class="lab-section">
      <h2>Leave Animation (card-eliminate)</h2>
      <p>
        クリックでカードがワイプ消滅します。アニメーションパターン（円 / 渦巻き）を切り替えて比較できます。
      </p>
      <div class="mode-switch">
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="circle" />
          Circle
        </label>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="spiral" />
          Spiral
        </label>
      </div>
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
        <Transition :name="leaveAnimationMode === 'spiral' ? 'card-spiral' : 'card-wipe'" mode="out-in">
          <ActionCard
            v-if="leaveCardVisible"
            key="leave-card"
            v-bind="sampleCard"
            :operations="[]"
            :affordable="true"
          />
        </Transition>
      </div>
    </section>
  </main>
</template>

<style scoped>
.animation-lab {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  color: #f8f2e7;
}

.lab-intro h1 {
  margin: 0 0 12px;
  font-size: 28px;
  letter-spacing: 0.08em;
}

.lab-intro p {
  margin: 0;
  color: rgba(248, 242, 231, 0.78);
  line-height: 1.6;
}

.lab-section {
  margin-top: 36px;
  padding: 24px;
  border-radius: 16px;
  background: rgba(14, 12, 18, 0.85);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
}

.lab-section h2 {
  margin: 0 0 8px;
  font-size: 20px;
}

.mode-switch {
  display: flex;
  gap: 12px;
  margin-top: 12px;
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
  background: rgba(36, 28, 52, 0.8);
  color: #fff1d8;
  cursor: pointer;
  letter-spacing: 0.08em;
}

.lab-button:hover {
  background: rgba(54, 40, 72, 0.85);
}

.lab-button--ghost {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.4);
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

.card-wipe-enter-active,
.card-wipe-leave-active {
  transition: clip-path 420ms ease;
}

.card-wipe-enter-from,
.card-wipe-leave-to {
  clip-path: circle(0% at 50% 50%);
}

.card-wipe-enter-to,
.card-wipe-leave-from {
  clip-path: circle(120% at 50% 50%);
}

/* materialize */
.enter-spawn-enter-from {
  opacity: 0;
  transform: scale(0.7);
  filter: blur(10px);
}

.enter-spawn-enter-to {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

.enter-spawn-enter-active {
  transition:
    opacity 1s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1s cubic-bezier(0.16, 1, 0.3, 1),
    filter 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.enter-spawn-enter-active :deep(.action-card)::before {
  content: '';
  position: absolute;
  inset: -8%;
  border-radius: inherit;
  background: radial-gradient(closest-side, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0) 70%);
  filter: blur(14px);
  opacity: 0;
  animation: halo 1s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes halo {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  60% {
    opacity: 0.9;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(1.25);
  }
}

/* reveal */
.enter-reveal-enter-from {
  opacity: 0;
  mask-size: 0% 0%;
  -webkit-mask-size: 0% 0%;
  mask-image: radial-gradient(circle at center, #000 0 0, transparent 0);
  -webkit-mask-image: radial-gradient(circle at center, #000 0 0, transparent 0);
  filter: blur(6px);
}

.enter-reveal-enter-to {
  opacity: 1;
  mask-size: 200% 200%;
  -webkit-mask-size: 200% 200%;
  filter: blur(0);
}

.enter-reveal-enter-active {
  transition:
    opacity 1s cubic-bezier(0.2, 0.9, 0.2, 1),
    mask-size 1s cubic-bezier(0.2, 0.9, 0.2, 1),
    -webkit-mask-size 1s cubic-bezier(0.2, 0.9, 0.2, 1),
    filter 1s cubic-bezier(0.2, 0.9, 0.2, 1);
}

/* flip */
.enter-flip-enter-from {
  opacity: 0;
  transform: rotateY(90deg) scale(0.96);
  filter: blur(4px);
}

.enter-flip-enter-to {
  opacity: 1;
  transform: rotateY(0deg) scale(1);
  filter: blur(0);
}

.enter-flip-enter-active {
  transition:
    transform 1s cubic-bezier(0.16, 1, 0.3, 1),
    opacity 1s ease-out,
    filter 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.enter-flip-enter-active :deep(.action-card) {
  transform-style: preserve-3d;
  backface-visibility: hidden;
}

.lab-stage :deep(.action-card) {
  will-change: transform, opacity, filter;
}

/* spark */
.enter-spark-enter-from {
  opacity: 0;
  transform: scale(0.85);
}

.enter-spark-enter-to {
  opacity: 1;
  transform: scale(1);
}

.enter-spark-enter-active {
  transition: opacity 1s ease-out, transform 1s ease-out;
}

.enter-spark-enter-active :deep(.action-card) {
  position: relative;
  overflow: visible;
}

.enter-spark-enter-active :deep(.action-card)::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: white;
  filter: blur(1px);
  mix-blend-mode: screen;
  opacity: 0;
  transform: scale(0.5);
  box-shadow:
    -60px -10px 0 0 rgba(255, 255, 255, 0.9),
    70px -30px 0 0 rgba(255, 255, 255, 0.6),
    -30px 50px 0 0 rgba(255, 255, 255, 0.7),
    40px 60px 0 0 rgba(255, 255, 255, 0.8),
    -10px -70px 0 0 rgba(255, 255, 255, 0.5);
  animation: sparks 1s ease-out forwards;
}

@keyframes sparks {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  40% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: scale(1.8);
  }
}

.card-spiral-enter-active,
.card-spiral-leave-active {
  animation: spiral-wipe 520ms ease forwards;
}

.card-spiral-leave-active {
  animation-direction: normal;
}

.card-spiral-enter-active {
  animation-direction: reverse;
}

@property --spiral-angle {
  syntax: '<angle>';
  initial-value: 0turn;
  inherits: false;
}

@keyframes spiral-wipe {
  from {
    --spiral-angle: 0turn;
    clip-path: path(
      'M0 0 H100 V100 H0 Z M50 50 L50 8 A42 42 0 1 1 92 50 Z'
    );
  }
  to {
    --spiral-angle: 1turn;
    clip-path: path(
      'M0 0 H100 V100 H0 Z M50 50 L50 50 A1 1 0 1 1 51 50 Z'
    );
  }
}

.card-spiral-enter-active,
.card-spiral-leave-active {
  position: relative;
  overflow: hidden;
  animation: conic-spin 520ms linear infinite;
}

.card-spiral-enter-active::after,
.card-spiral-leave-active::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 16px;
  background:
    radial-gradient(circle at 75% 25%, rgba(255, 255, 255, 0.12), transparent 55%),
    conic-gradient(
      from var(--spiral-angle, 0turn),
      rgba(255, 255, 255, 0.35) 0deg,
      rgba(122, 85, 255, 0.45) 120deg,
      rgba(255, 149, 72, 0.45) 240deg,
      rgba(255, 255, 255, 0.35) 360deg
    );
  mix-blend-mode: screen;
  pointer-events: none;
  filter: blur(1px);
}

@keyframes conic-spin {
  to {
    --spiral-angle: 1turn;
  }
}

@media (prefers-reduced-motion: reduce) {
  .enter-spawn-enter-active,
  .enter-reveal-enter-active,
  .enter-flip-enter-active,
  .enter-spark-enter-active,
  .card-wipe-enter-active,
  .card-wipe-leave-active,
  .card-spiral-enter-active,
  .card-spiral-leave-active {
    transition-duration: 200ms !important;
    animation-duration: 200ms !important;
  }
}
</style>
.mode-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}
