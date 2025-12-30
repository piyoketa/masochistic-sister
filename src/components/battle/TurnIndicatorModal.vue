<!--
TurnIndicatorModal の責務:
- プレイヤー/エネミーのターン遷移を示すフラッシュ演出を 0.6 秒だけ表示するモーダルオーバーレイ。
- 呼び出し側から play(variant) を実行するだけで再生できるインターフェースを提供し、BattleView などが簡単にデバッグ再生できるようにする。

責務ではないこと:
- 実際のターン遷移の判定やログ再生制御は担わない。表示タイミングの判断は呼び出し元に任せる。

主な通信相手とインターフェース:
- 呼び出し元 (例: BattleView) が `play(variant: 'player' | 'enemy')` を呼ぶことで演出を開始する。表示時間は内部の setTimeout で管理し、重複呼び出し時は requestAnimationFrame で DOM を張り替えてアニメーションを確実にリスタートする。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

type TurnVariant = 'player' | 'enemy'

const indicatorLifetimeMs = 600
const isVisible = ref(false)
const indicatorKey = ref(0)
const currentVariant = ref<TurnVariant>('player')
let hideTimer: ReturnType<typeof setTimeout> | null = null

const indicatorText = computed(() =>
  currentVariant.value === 'player' ? 'PLAYER TURN' : 'ENEMY TURN',
)

function clearTimer(): void {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function play(variant: TurnVariant): void {
  clearTimer()
  currentVariant.value = variant
  // 表示中の再生でも確実に CSS アニメーションを張り替えるため、1フレーム非表示→再マウントする
  isVisible.value = false
  requestAnimationFrame(() => {
    indicatorKey.value += 1
    isVisible.value = true
    hideTimer = setTimeout(() => {
      isVisible.value = false
      hideTimer = null
    }, indicatorLifetimeMs)
  })
}

defineExpose({ play })

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<template>
  <transition name="turn-indicator-fade">
    <div v-if="isVisible" class="turn-indicator-modal" role="status" aria-live="polite">
      <div class="turn-indicator-modal__backdrop"></div>
      <div
        :key="indicatorKey"
        :class="['turn-indicator', `turn-indicator--${currentVariant}`]"
        aria-hidden="true"
      >
        <span class="turn-indicator__glow"></span>
        <span class="turn-indicator__text">{{ indicatorText }}</span>
        <span class="turn-indicator__stripe"></span>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.turn-indicator-modal {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 1200;
  pointer-events: none;
}

.turn-indicator-modal__backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 45%, rgba(0, 0, 0, 0.10), rgba(0, 0, 0, 0.25));
}

.turn-indicator {
  position: relative;
  display: grid;
  place-items: center;
  animation: turnFlash 0.6s ease-in-out forwards;
}

.turn-indicator__glow {
  position: absolute;
  width: min(72vw, 420px);
  height: min(72vw, 420px);
  background: radial-gradient(circle, var(--indicator-glow, rgba(255, 255, 255, 0.28)), transparent 60%);
  filter: blur(16px);
  transform: translateY(-6px);
}

.turn-indicator__text {
  position: relative;
  z-index: 1;
  font-size: clamp(34px, 6vw, 64px);
  letter-spacing: 0.16em;
  font-weight: 800;
  text-transform: uppercase;
  font-family: 'Bebas Neue', 'Barlow Condensed', 'Noto Sans JP', 'Inter', system-ui, sans-serif;
  background: linear-gradient(120deg, var(--indicator-text-from, #e8f6ff), var(--indicator-text-to, #a2d9ff));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    0 0 14px var(--indicator-text-shadow, rgba(255, 255, 255, 0.55)),
    0 4px 18px rgba(0, 0, 0, 0.45);
}

.turn-indicator__stripe {
  position: absolute;
  top: 54%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(76vw, 540px);
  height: 6px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--indicator-accent, #7ee0ff) 30%,
    var(--indicator-accent-weak, #c8f1ff) 50%,
    var(--indicator-accent, #7ee0ff) 70%,
    transparent
  );
  opacity: 0.9;
  filter: drop-shadow(0 0 10px var(--indicator-shadow, rgba(126, 224, 255, 0.55)));
}

.turn-indicator--player {
  --indicator-glow: rgba(126, 224, 255, 0.28);
  --indicator-text-from: #e8f6ff;
  --indicator-text-to: #7ee0ff;
  --indicator-text-shadow: rgba(126, 224, 255, 0.55);
  --indicator-accent: #7ee0ff;
  --indicator-accent-weak: #c8f1ff;
  --indicator-shadow: rgba(126, 224, 255, 0.55);
}

.turn-indicator--enemy {
  --indicator-glow: rgba(255, 106, 139, 0.32);
  --indicator-text-from: #fff4e6;
  --indicator-text-to: #ff9cae;
  --indicator-text-shadow: rgba(255, 176, 176, 0.6);
  --indicator-accent: #ff6a8b;
  --indicator-accent-weak: #ffd166;
  --indicator-shadow: rgba(255, 122, 155, 0.55);
}

@keyframes turnFlash {
  0% {
    opacity: 0;
    transform: translateY(12px) scale(0.9);
    filter: blur(6px);
  }
  18% {
    opacity: 1;
    transform: translateY(0) scale(1.04);
    filter: blur(0);
  }
  50% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
  82% {
    opacity: 0.7;
    transform: translateY(-6px) scale(0.98);
    filter: blur(2px);
  }
  100% {
    opacity: 0;
    transform: translateY(-12px) scale(0.96);
    filter: blur(8px);
  }
}

.turn-indicator-fade-enter-active,
.turn-indicator-fade-leave-active {
  transition: opacity 0.12s ease;
}

.turn-indicator-fade-enter-from,
.turn-indicator-fade-leave-to {
  opacity: 0;
}
</style>
