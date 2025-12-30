<!--
PlayerTurnDemoView の責務:
- ターン開始演出で使用する「Player Turn」の 0.6 秒表示アニメーションを単体で検証するデモ画面を提供する。
- ボタン操作で演出を何度も再生し、視認性や点滅速度を確認しやすいステージを用意する。

責務ではないこと:
- Battle のターン管理や表示タイミングの判断は行わず、純粋なビジュアル確認のみに限定する。

主なインターフェース:
- isShowingIndicator: boolean — true の間だけ「Player Turn」を表示し、CSS アニメーションを走らせる。
- playPlayerTurnCue(): void — 0.6s 表示 → 自動非表示のサイクルを開始する。requestAnimationFrame で DOM を一拍外し、表示中でも確実にアニメーションを張り直す（単純な v-if トグルとの違い）。
- タイマー管理: setTimeout で 0.6s 後に isShowingIndicator を false に戻す。重複クリック時は先行タイマーをクリアし、表示時間をリセットする。
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const indicatorLifetimeMs = 600
const isShowingIndicator = ref(false)
const indicatorKey = ref(0)
let hideTimer: ReturnType<typeof setTimeout> | null = null

function playPlayerTurnCue(): void {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  // 表示中でも確実に CSS アニメーションをリスタートできるよう、一旦非表示にして次フレームで再マウントする
  isShowingIndicator.value = false
  requestAnimationFrame(() => {
    indicatorKey.value += 1
    isShowingIndicator.value = true
    hideTimer = setTimeout(() => {
      isShowingIndicator.value = false
      hideTimer = null
    }, indicatorLifetimeMs)
  })
}

onMounted(() => {
  // ページ表示時に 1 回流し、質感をすぐ確認できるようにする
  playPlayerTurnCue()
})

onBeforeUnmount(() => {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
})
</script>

<template>
  <div class="player-turn-demo">
    <header class="demo-header">
      <div>
        <p class="badge">Turn Indicator Lab</p>
        <h1>Player Turn Flash Demo</h1>
        <p class="lead">ターン開始で「Player Turn」を 0.6 秒だけフラッシュ表示する演出の試作ページ。</p>
      </div>
      <button type="button" class="replay-button" @click="playPlayerTurnCue">
        再生する
      </button>
    </header>

    <main class="demo-body">
      <section class="panel">
        <h2>意図とパラメータ</h2>
        <ul class="spec-list">
          <li>表示時間: 0.6s（enter 0.15s / hold 0.3s / leave 0.15s）</li>
          <li>短尺フラッシュ演出として表示中のみ DOM をマウント</li>
          <li>重複クリックでも requestAnimationFrame で確実にリスタート</li>
        </ul>
        <p class="hint">ボタンを押すたびに 0.6s 表示がリセットされます。</p>
      </section>

      <section class="stage">
        <div class="stage-frame">
          <p class="stage-note">Player Turn がここに一瞬重なります</p>
          <div
            v-if="isShowingIndicator"
            :key="indicatorKey"
            class="player-turn-indicator"
            role="status"
            aria-live="polite"
          >
            <span class="indicator-glow"></span>
            <span class="indicator-text">PLAYER TURN</span>
            <span class="indicator-stripe"></span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.player-turn-demo {
  min-height: 100vh;
  padding: 32px;
  box-sizing: border-box;
  color: #f2faff;
  background:
    radial-gradient(circle at 22% 18%, rgba(92, 164, 255, 0.22), rgba(13, 30, 52, 0.9)),
    linear-gradient(135deg, #0c1428, #0f2039 55%, #0a0f20);
  letter-spacing: 0.02em;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin: 0;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.demo-header h1 {
  margin: 4px 0 0;
  font-size: 30px;
  letter-spacing: 0.08em;
  font-family: 'Bebas Neue', 'Barlow Condensed', 'Noto Sans JP', 'Inter', system-ui, sans-serif;
}

.lead {
  margin: 8px 0 0;
  color: #c8dcff;
  line-height: 1.6;
}

.replay-button {
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: linear-gradient(135deg, #7ee0ff, #8fd0ff);
  color: #071929;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: transform 0.14s ease, box-shadow 0.14s ease, filter 0.14s ease;
  box-shadow: 0 10px 24px rgba(126, 224, 255, 0.28);
}

.replay-button:hover,
.replay-button:focus-visible {
  transform: translateY(-1px) scale(1.01);
  filter: brightness(1.04);
  box-shadow: 0 12px 30px rgba(143, 208, 255, 0.36);
}

.demo-body {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  align-items: start;
  margin-top: 22px;
}

.panel {
  padding: 18px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
}

.panel h2 {
  margin: 0 0 10px;
  font-size: 18px;
  letter-spacing: 0.06em;
}

.spec-list {
  margin: 0 0 8px;
  padding-left: 18px;
  color: #d9e9ff;
  line-height: 1.6;
}

.hint {
  margin: 8px 0 0;
  color: #9fd2ff;
  font-size: 13px;
}

.stage {
  width: 100%;
}

.stage-frame {
  position: relative;
  min-height: 320px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background:
    radial-gradient(circle at 50% 35%, rgba(126, 224, 255, 0.16), rgba(9, 16, 28, 0.9)),
    linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(0, 0, 0, 0.28));
  overflow: hidden;
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03), 0 16px 38px rgba(0, 0, 0, 0.32);
}

.stage-frame::before,
.stage-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.06),
      rgba(255, 255, 255, 0.06) 1px,
      transparent 1px,
      transparent 80px
    ),
    repeating-linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.05),
      rgba(255, 255, 255, 0.05) 1px,
      transparent 1px,
      transparent 60px
    );
  opacity: 0.18;
}

.stage-frame::after {
  background: radial-gradient(circle at 50% 50%, rgba(126, 224, 255, 0.2), transparent 45%);
  opacity: 0.6;
}

.stage-note {
  position: absolute;
  left: 16px;
  bottom: 14px;
  margin: 0;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.35);
  color: rgba(255, 255, 255, 0.75);
  letter-spacing: 0.05em;
  font-size: 13px;
}

.player-turn-indicator {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  animation: playerTurnFlash 0.6s ease-in-out forwards;
  pointer-events: none;
}

.indicator-glow {
  position: absolute;
  width: min(70vw, 380px);
  height: min(70vw, 380px);
  background: radial-gradient(circle, rgba(126, 224, 255, 0.32), rgba(126, 224, 255, 0) 60%);
  filter: blur(14px);
  opacity: 0.9;
  transform: translateY(-6px);
}

.indicator-text {
  position: relative;
  z-index: 1;
  font-size: clamp(34px, 6vw, 64px);
  letter-spacing: 0.16em;
  font-weight: 800;
  text-transform: uppercase;
  font-family: 'Bebas Neue', 'Barlow Condensed', 'Noto Sans JP', 'Inter', system-ui, sans-serif;
  background: linear-gradient(120deg, #e8f6ff, #a2d9ff 60%, #7ee0ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    0 0 14px rgba(126, 224, 255, 0.6),
    0 4px 18px rgba(0, 0, 0, 0.45);
}

.indicator-stripe {
  position: absolute;
  top: 54%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(72vw, 520px);
  height: 6px;
  background: linear-gradient(90deg, transparent, #7ee0ff 30%, #c8f1ff 50%, #7ee0ff 70%, transparent);
  opacity: 0.9;
  filter: drop-shadow(0 0 10px rgba(126, 224, 255, 0.55));
}

@keyframes playerTurnFlash {
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

@media (max-width: 900px) {
  .player-turn-demo {
    padding: 22px 18px 32px;
  }

  .demo-body {
    grid-template-columns: 1fr;
  }

  .stage-frame {
    min-height: 260px;
  }
}
</style>
