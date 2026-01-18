<!--
DamageFlashDemoView の責務:
- プレイヤーが被ダメージを受けた瞬間の「全画面赤フラッシュ」演出をデモ表示する。
- ボタン操作でフラッシュを発火し、演出の見え方を確認できる場を提供する。

責務ではないこと:
- 戦闘ロジックやダメージ計算、AnimationInstruction の解釈は行わない。
- 実際のダメージイベントの発火タイミングの決定は行わない。

主な通信相手とインターフェース:
- 通信相手はなし。デモ画面内のローカル状態のみで完結する。
-->
<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'

const FLASH_DURATION_MS = 260

const flashVisible = ref(false)
const flashKey = ref(0)
const lastDamageAmount = ref(18)
const inputDamage = ref(20)
let flashTimerId: number | null = null

function clearFlashTimer(): void {
  if (flashTimerId === null) {
    return
  }
  window.clearTimeout(flashTimerId)
  flashTimerId = null
}

function triggerDamageFlash(amount: number): void {
  // 設計判断: 同時に複数回呼ばれても「最新のダメージ」を優先し、
  // アニメーションは key を更新して強制的に再スタートさせる。
  lastDamageAmount.value = Math.max(0, Math.floor(amount))
  flashKey.value += 1
  flashVisible.value = true
  clearFlashTimer()
  flashTimerId = window.setTimeout(() => {
    flashVisible.value = false
    flashTimerId = null
  }, FLASH_DURATION_MS)
}

function handleTriggerClick(): void {
  triggerDamageFlash(inputDamage.value)
}

function handleRandomTriggerClick(): void {
  const random = 8 + Math.floor(Math.random() * 45)
  triggerDamageFlash(random)
}

onBeforeUnmount(() => {
  clearFlashTimer()
})
</script>

<template>
  <div class="flash-demo">
    <div v-if="flashVisible" :key="flashKey" class="flash-demo__overlay" />
    <header class="flash-demo__header">
      <p class="flash-demo__kicker">Damage Flash Demo</p>
      <h1 class="flash-demo__title">全画面フラッシュ演出</h1>
      <p class="flash-demo__lead">
        被ダメージの瞬間に、画面全体が赤く点滅する演出を想定したデモです。
      </p>
    </header>
    <main class="flash-demo__layout">
      <section class="flash-demo__panel">
        <label class="flash-demo__label" for="damage-input">ダメージ量</label>
        <input
          id="damage-input"
          v-model.number="inputDamage"
          class="flash-demo__input"
          type="number"
          min="0"
          step="1"
        />
        <div class="flash-demo__actions">
          <button class="flash-demo__button" type="button" @click="handleTriggerClick">
            被ダメージを発生させる
          </button>
          <button class="flash-demo__button flash-demo__button--ghost" type="button" @click="handleRandomTriggerClick">
            ランダム被ダメージ
          </button>
        </div>
        <p class="flash-demo__hint">
          最後の被ダメージ: <span class="flash-demo__hint-value">{{ lastDamageAmount }}</span>
        </p>
      </section>
      <section class="flash-demo__stage">
        <div class="flash-demo__stage-frame">
          <p class="flash-demo__stage-title">Battle Screen Mock</p>
          <div class="flash-demo__stage-grid">
            <div class="flash-demo__card flash-demo__card--player">
              <p class="flash-demo__card-label">Player</p>
              <p class="flash-demo__card-hp">HP 30 / 30</p>
            </div>
            <div class="flash-demo__card flash-demo__card--enemy">
              <p class="flash-demo__card-label">Enemy</p>
              <p class="flash-demo__card-hp">HP 40 / 40</p>
            </div>
          </div>
          <p class="flash-demo__stage-note">※ 実際はバトル画面全体に適用する想定です。</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.flash-demo {
  min-height: 100vh;
  padding: 40px 24px 80px;
  color: #f4ece4;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 74, 74, 0.2), transparent 55%),
    radial-gradient(circle at 80% 10%, rgba(255, 180, 110, 0.12), transparent 50%),
    linear-gradient(180deg, #141019 0%, #0b0a12 60%, #0a0a10 100%);
}

.flash-demo__overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 50% 45%, rgba(255, 60, 60, 0.6), rgba(180, 0, 0, 0.35)),
    linear-gradient(180deg, rgba(255, 120, 120, 0.4), rgba(120, 0, 0, 0.45));
  opacity: 0;
  animation: flash-demo-fade 260ms ease-out;
  z-index: 999;
}

.flash-demo__header {
  max-width: 720px;
  margin: 0 auto 32px;
}

.flash-demo__kicker {
  margin: 0 0 8px;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.28em;
  color: rgba(255, 210, 210, 0.65);
}

.flash-demo__title {
  margin: 0 0 12px;
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  font-size: 34px;
  letter-spacing: 0.08em;
}

.flash-demo__lead {
  margin: 0;
  max-width: 560px;
  color: rgba(255, 220, 220, 0.75);
  line-height: 1.6;
}

.flash-demo__layout {
  display: grid;
  gap: 28px;
  max-width: 980px;
  margin: 0 auto;
}

.flash-demo__panel {
  border-radius: 18px;
  padding: 24px;
  background: rgba(20, 12, 18, 0.7);
  border: 1px solid rgba(255, 120, 120, 0.15);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);
}

.flash-demo__label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  letter-spacing: 0.16em;
  color: rgba(255, 210, 210, 0.7);
}

.flash-demo__input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 140, 140, 0.3);
  background: rgba(12, 8, 12, 0.65);
  color: #fef0ef;
  font-size: 16px;
}

.flash-demo__actions {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.flash-demo__button {
  padding: 12px 16px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(120deg, #ff6464, #d1151a);
  color: #fff7f7;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
}

.flash-demo__button--ghost {
  background: transparent;
  border: 1px solid rgba(255, 140, 140, 0.45);
  color: rgba(255, 210, 210, 0.9);
}

.flash-demo__hint {
  margin-top: 18px;
  font-size: 13px;
  color: rgba(255, 210, 210, 0.7);
}

.flash-demo__hint-value {
  font-weight: 700;
  color: #ffd0d0;
}

.flash-demo__stage {
  border-radius: 18px;
  padding: 24px;
  background: rgba(10, 10, 14, 0.7);
  border: 1px solid rgba(255, 120, 120, 0.1);
}

.flash-demo__stage-frame {
  border-radius: 16px;
  padding: 24px;
  background: radial-gradient(circle at 30% 20%, rgba(255, 105, 120, 0.12), transparent 60%),
    rgba(6, 6, 10, 0.85);
  border: 1px solid rgba(255, 100, 120, 0.2);
}

.flash-demo__stage-title {
  margin: 0 0 16px;
  font-size: 14px;
  letter-spacing: 0.2em;
  color: rgba(255, 200, 200, 0.75);
  text-transform: uppercase;
}

.flash-demo__stage-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.flash-demo__card {
  border-radius: 14px;
  padding: 16px;
  background: rgba(20, 12, 18, 0.9);
  border: 1px solid rgba(255, 120, 120, 0.2);
}

.flash-demo__card--player {
  box-shadow: 0 10px 18px rgba(120, 0, 20, 0.25);
}

.flash-demo__card--enemy {
  box-shadow: 0 10px 18px rgba(80, 0, 0, 0.35);
}

.flash-demo__card-label {
  margin: 0 0 8px;
  font-size: 14px;
  letter-spacing: 0.12em;
  color: rgba(255, 210, 210, 0.8);
}

.flash-demo__card-hp {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.flash-demo__stage-note {
  margin: 16px 0 0;
  font-size: 12px;
  color: rgba(255, 210, 210, 0.6);
}

@keyframes flash-demo-fade {
  0% {
    opacity: 0;
  }
  28% {
    opacity: 0.65;
  }
  100% {
    opacity: 0;
  }
}

@media (min-width: 960px) {
  .flash-demo__layout {
    grid-template-columns: 360px 1fr;
    align-items: start;
  }
}
</style>
