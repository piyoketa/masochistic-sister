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
import { computed, nextTick, ref } from 'vue'
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
const leaveAnimationMode = ref<'circle' | 'spiral' | 'burnout' | 'svg-burn' | 'ash' | 'ringburn'>('circle')
const enterAnimationMode = ref<'spawn' | 'reveal' | 'flip' | 'spark'>('spawn')
const leaveTransitionName = computed(() => {
  switch (leaveAnimationMode.value) {
    case 'circle':
      return 'card-wipe'
    case 'spiral':
      return 'card-spiral'
    case 'burnout':
      return 'card-burnout'
    case 'svg-burn':
      return 'card-svg-burn'
    case 'ash':
      return 'card-ash'
    case 'ringburn':
      return 'card-ringburn'
    default:
      return 'card-wipe'
  }
})

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
        クリックでカードが消滅する様子を確認できます。従来の円形 / 渦巻ワイプに加え、提案いただいた焦げ落ち系アニメーション
        4 種（焦げ穴 / SVG 灰化 / 砂化 / リング燃焼）を切り替えて比較できます。
      </p>
      <div class="mode-switch mode-switch--wrap">
        <span class="mode-switch__label">Classic</span>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="circle" />
          Circle
        </label>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="spiral" />
          Spiral
        </label>
      </div>
      <div class="mode-switch mode-switch--wrap">
        <span class="mode-switch__label">Burn Variants</span>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="burnout" />
          焦げ穴 Burnout
        </label>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="svg-burn" />
          SVG Burn
        </label>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="ash" />
          砂化 Ash
        </label>
        <label>
          <input v-model="leaveAnimationMode" type="radio" value="ringburn" />
          Ring Burn
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
        <Transition :name="leaveTransitionName" mode="out-in">
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
    <svg class="lab-defs" width="0" height="0" aria-hidden="true">
      <defs>
        <filter id="lab-burn-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
    </svg>
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

:global(:root) {
  --lab-burn-ease: cubic-bezier(0.2, 0.9, 0.2, 1);
  --lab-burn-noise-img: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAFUlEQVR4nGP4z/D/fwYGBgaGhgYAAAwIAfK0Nn+sAAAAAElFTkSuQmCC');
}

.mode-switch {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.mode-switch--wrap {
  flex-wrap: wrap;
  align-items: center;
}

.mode-switch__label {
  font-size: 12px;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.6);
  text-transform: uppercase;
}

.lab-defs {
  position: absolute;
  width: 0;
  height: 0;
  pointer-events: none;
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

@property --burn-radius {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}

@property --svg-burn-progress {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}

@property --ringburn-progress {
  syntax: '<percentage>';
  initial-value: 0%;
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

/* 焦げ穴 Burnout */
:global(.card-burnout-enter-from),
:global(.card-burnout-leave-to) {
  opacity: 0;
  transform: scale(0.98);
  --burn-radius: 120%;
}

:global(.card-burnout-enter-to),
:global(.card-burnout-leave-from) {
  opacity: 1;
  transform: scale(1);
  --burn-radius: 0%;
}

:global(.card-burnout-enter-active),
:global(.card-burnout-leave-active) {
  transition:
    opacity 700ms var(--lab-burn-ease),
    transform 700ms var(--lab-burn-ease),
    --burn-radius 700ms var(--lab-burn-ease);
}

:global(.card-burnout-leave-active) :deep(.action-card) {
  position: relative;
  -webkit-mask-image:
    radial-gradient(circle at center, transparent 0 var(--burn-radius), #000 calc(var(--burn-radius) + 1%)),
    var(--lab-burn-noise-img);
  mask-image:
    radial-gradient(circle at center, transparent 0 var(--burn-radius), #000 calc(var(--burn-radius) + 1%)),
    var(--lab-burn-noise-img);
  -webkit-mask-repeat: no-repeat, repeat;
  mask-repeat: no-repeat, repeat;
  -webkit-mask-position: 50% 50%, 0 0;
  mask-position: 50% 50%, 0 0;
  -webkit-mask-size: 220% 220%, auto;
  mask-size: 220% 220%, auto;
}

:global(.card-burnout-leave-active) :deep(.action-card)::after {
  content: '';
  position: absolute;
  inset: -10%;
  border-radius: inherit;
  background: radial-gradient(closest-side, rgba(255, 148, 43, 0.35), rgba(255, 148, 43, 0));
  filter: blur(12px);
  opacity: 0;
  animation: burnGlow 700ms var(--lab-burn-ease);
  pointer-events: none;
}

@keyframes burnGlow {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  40% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: scale(1.25);
  }
}

@keyframes ember {
  0% {
    opacity: 0;
  }
  40% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
  }
}

/* SVG Burn inspired */
:global(.card-svg-burn-enter-from),
:global(.card-svg-burn-leave-to) {
  opacity: 0;
  transform: scale(0.96);
  --svg-burn-progress: 120%;
}

:global(.card-svg-burn-enter-to),
:global(.card-svg-burn-leave-from) {
  opacity: 1;
  transform: scale(1);
  --svg-burn-progress: 0%;
}

:global(.card-svg-burn-enter-active),
:global(.card-svg-burn-leave-active) {
  transition:
    opacity 700ms var(--lab-burn-ease),
    transform 700ms var(--lab-burn-ease),
    --svg-burn-progress 700ms var(--lab-burn-ease);
}

:global(.card-svg-burn-leave-active) :deep(.action-card) {
  position: relative;
  overflow: visible;
  animation: svgBurnMask 700ms var(--lab-burn-ease) forwards;
}

:global(.card-svg-burn-leave-active) :deep(.action-card)::before {
  content: '';
  position: absolute;
  inset: -8%;
  border-radius: inherit;
  background: radial-gradient(circle at center, rgba(17, 8, 2, 0) calc(var(--svg-burn-progress) - 6%), rgba(10, 4, 1, 0.9) var(--svg-burn-progress));
  -webkit-mask-image: radial-gradient(circle at center, transparent calc(var(--svg-burn-progress) - 4%), #000 calc(var(--svg-burn-progress) + 2%));
  mask-image: radial-gradient(circle at center, transparent calc(var(--svg-burn-progress) - 4%), #000 calc(var(--svg-burn-progress) + 2%));
  filter: url(#lab-burn-noise);
  mix-blend-mode: multiply;
  pointer-events: none;
}

:global(.card-svg-burn-leave-active) :deep(.action-card)::after {
  content: '';
  position: absolute;
  inset: -12%;
  border-radius: inherit;
  background: radial-gradient(closest-side, rgba(255, 190, 120, 0.4), rgba(255, 190, 120, 0));
  opacity: 0;
  filter: blur(16px);
  animation: ember 700ms var(--lab-burn-ease);
  pointer-events: none;
}

@keyframes svgBurnMask {
  from {
    --svg-burn-progress: 0%;
  }
  to {
    --svg-burn-progress: 120%;
  }
}

/* 砂化 Ash */
:global(.card-ash-enter-from),
:global(.card-ash-leave-to) {
  opacity: 0;
  transform: translateY(4px);
}

:global(.card-ash-enter-to),
:global(.card-ash-leave-from) {
  opacity: 1;
  transform: translateY(0);
}

:global(.card-ash-enter-active),
:global(.card-ash-leave-active) {
  transition: opacity 620ms ease, transform 620ms ease;
}

:global(.card-ash-leave-active) :deep(.action-card) {
  position: relative;
  -webkit-mask-image: linear-gradient(to top, transparent 0% 25%, #000 55% 100%);
  mask-image: linear-gradient(to top, transparent 0% 25%, #000 55% 100%);
  -webkit-mask-position: 50% 0%;
  mask-position: 50% 0%;
  -webkit-mask-size: 100% 220%;
  mask-size: 100% 220%;
  animation: ashMask 620ms ease forwards;
}

:global(.card-ash-leave-active) :deep(.action-card)::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 10%;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
  opacity: 0;
  mix-blend-mode: screen;
  filter: blur(0.5px);
  box-shadow:
    -40px 6px 0 0 rgba(200, 200, 200, 0.9),
    10px -3px 0 0 rgba(220, 220, 220, 0.7),
    30px 1px 0 0 rgba(230, 230, 230, 0.7),
    -20px -4px 0 0 rgba(210, 210, 210, 0.8),
    45px 5px 0 0 rgba(200, 200, 200, 0.6);
  animation: ashRise 620ms ease-out forwards;
  pointer-events: none;
}

@keyframes ashMask {
  0% {
    -webkit-mask-position: 50% 0%;
    mask-position: 50% 0%;
  }
  100% {
    -webkit-mask-position: 50% 100%;
    mask-position: 50% 100%;
  }
}

@keyframes ashRise {
  0% {
    opacity: 0;
    transform: translate(-50%, 0) scale(1);
  }
  20% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -34px) scale(0.9);
  }
}

/* Ring Burn */
:global(.card-ringburn-enter-from),
:global(.card-ringburn-leave-to) {
  opacity: 0;
  transform: scale(0.96);
  --ringburn-progress: 0%;
}

:global(.card-ringburn-enter-to),
:global(.card-ringburn-leave-from) {
  opacity: 1;
  transform: scale(1);
  --ringburn-progress: 60%;
}

:global(.card-ringburn-enter-active),
:global(.card-ringburn-leave-active) {
  transition:
    opacity 640ms var(--lab-burn-ease),
    transform 640ms var(--lab-burn-ease),
    --ringburn-progress 640ms var(--lab-burn-ease);
}

:global(.card-ringburn-leave-active) :deep(.action-card) {
  position: relative;
  -webkit-mask-image: radial-gradient(closest-side, #000 calc(var(--ringburn-progress) - 2%), transparent var(--ringburn-progress));
  mask-image: radial-gradient(closest-side, #000 calc(var(--ringburn-progress) - 2%), transparent var(--ringburn-progress));
  animation: ringburnErode 640ms var(--lab-burn-ease) forwards;
}

:global(.card-ringburn-leave-active) :deep(.action-card)::before {
  content: '';
  position: absolute;
  inset: -6%;
  border-radius: inherit;
  background: conic-gradient(
      from 0turn,
      rgba(255, 180, 0, 0) 0turn,
      rgba(255, 120, 0, 0.45) 0.85turn,
      rgba(255, 180, 0, 0) 1turn
    );
  filter: blur(10px);
  opacity: 0;
  animation:
    emberRing 320ms ease-out forwards,
    emberFade 640ms ease-out 160ms forwards;
  pointer-events: none;
}

:global(.card-ringburn-leave-active) :deep(.action-card)::after {
  content: '';
  position: absolute;
  inset: -8%;
  border-radius: inherit;
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 180, 0, 0.4), transparent 50%),
    radial-gradient(circle at 12% 82%, rgba(255, 90, 0, 0.25), transparent 55%);
  opacity: 0;
  animation: ember 640ms var(--lab-burn-ease);
  pointer-events: none;
}

@keyframes ringburnErode {
  0% {
    --ringburn-progress: 60%;
  }
  100% {
    --ringburn-progress: 2%;
  }
}

@keyframes emberRing {
  from {
    opacity: 0;
    transform: rotate(0turn);
  }
  to {
    opacity: 0.9;
    transform: rotate(0.75turn);
  }
}

@keyframes emberFade {
  to {
    opacity: 0;
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
  .card-spiral-leave-active,
  .card-burnout-enter-active,
  .card-burnout-leave-active,
  .card-svg-burn-enter-active,
  .card-svg-burn-leave-active,
  .card-ash-enter-active,
  .card-ash-leave-active,
  .card-ringburn-enter-active,
  .card-ringburn-leave-active {
    transition-duration: 200ms !important;
    animation-duration: 200ms !important;
  }
}
</style>
