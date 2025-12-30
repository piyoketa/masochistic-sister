<!--
EnemyTurnDemoView の責務:
- ターン切替演出で使用する「Enemy Turn」の 0.6 秒表示アニメーションを単体で検証できるデモ画面を提供する。
- ボタン操作で何度でも演出を再生し、点滅時間や視認性を調整しやすいステージを用意する。

責務ではないこと:
- Battle のターン管理や進行制御は行わず、表示タイミングの判断は上位レイヤーに委ねる。

主なインターフェース:
- ローカル状態 isShowingIndicator: boolean — true の間だけ「Enemy Turn」を表示し CSS アニメーションを走らせる。
- playEnemyTurnCue(): void — 0.6s 表示 → 自動非表示のサイクルを開始する。requestAnimationFrame で DOM を一拍外し、表示中でも確実にアニメーションをリセットする点が単純な v-if トグルとの違い。
- タイマー管理: setTimeout で 0.6s 後に isShowingIndicator を false に戻す。重複クリック時は先行タイマーをクリアし、表示時間を毎回リセットする。
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const indicatorLifetimeMs = 600
const isShowingIndicator = ref(false)
const indicatorKey = ref(0)
let hideTimer: ReturnType<typeof setTimeout> | null = null

function playEnemyTurnCue(): void {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }

  // 表示中でも確実に CSS アニメーションを張り直すため、一旦非表示にした上で次フレームでマウントし直す
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
  // ページロード時に 1 回流して質感を即確認できるようにする
  playEnemyTurnCue()
})

onBeforeUnmount(() => {
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
})
</script>

<template>
  <div class="enemy-turn-demo">
    <header class="demo-header">
      <div>
        <p class="badge">Turn Indicator Lab</p>
        <h1>Enemy Turn Flash Demo</h1>
        <p class="lead">ターン終了で「Enemy Turn」を 0.6 秒だけフラッシュ表示する演出の試作ページ。</p>
      </div>
      <button type="button" class="replay-button" @click="playEnemyTurnCue">
        再生する
      </button>
    </header>

    <main class="demo-body">
      <section class="panel">
        <h2>意図とパラメータ</h2>
        <ul class="spec-list">
          <li>表示時間: 0.6s（enter 0.15s / hold 0.3s / leave 0.15s）</li>
          <li>表示中だけ DOM をマウントし、スパッと出て消える短尺演出に固定</li>
          <li>重複クリックでも requestAnimationFrame で確実にアニメーションをリスタート</li>
        </ul>
        <p class="hint">ボタンを押すたびに 0.6s 表示がリセットされます。</p>
      </section>

      <section class="stage">
        <div class="stage-frame">
          <p class="stage-note">Enemy Turn がここに一瞬重なります</p>
          <div
            v-if="isShowingIndicator"
            :key="indicatorKey"
            class="enemy-turn-indicator"
            role="status"
            aria-live="polite"
          >
            <span class="indicator-glow"></span>
            <span class="indicator-text">ENEMY TURN</span>
            <span class="indicator-stripe"></span>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.enemy-turn-demo {
  min-height: 100vh;
  padding: 32px;
  box-sizing: border-box;
  color: #f5f2ff;
  background:
    radial-gradient(circle at 18% 22%, rgba(135, 92, 255, 0.2), rgba(16, 19, 38, 0.9)),
    linear-gradient(135deg, #0c1124, #131b33 55%, #0d0f1d);
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
  border: 1px solid rgba(255, 255, 255, 0.24);
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
  color: #c7d0f0;
  line-height: 1.6;
}

.replay-button {
  padding: 12px 18px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: linear-gradient(135deg, #ffb27a, #ff6a8b);
  color: #1d0f1c;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: transform 0.14s ease, box-shadow 0.14s ease, filter 0.14s ease;
  box-shadow: 0 10px 24px rgba(255, 122, 155, 0.28);
}

.replay-button:hover,
.replay-button:focus-visible {
  transform: translateY(-1px) scale(1.01);
  filter: brightness(1.05);
  box-shadow: 0 12px 30px rgba(255, 136, 170, 0.36);
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
  color: #dce3ff;
  line-height: 1.6;
}

.hint {
  margin: 8px 0 0;
  color: #9ab2ff;
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
    radial-gradient(circle at 50% 35%, rgba(255, 106, 139, 0.12), rgba(9, 13, 26, 0.9)),
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
  background: radial-gradient(circle at 50% 50%, rgba(255, 137, 174, 0.18), transparent 45%);
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

.enemy-turn-indicator {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  animation: enemyTurnFlash 0.6s ease-in-out forwards;
  pointer-events: none;
}

.indicator-glow {
  position: absolute;
  width: min(70vw, 380px);
  height: min(70vw, 380px);
  background: radial-gradient(circle, rgba(255, 106, 139, 0.32), rgba(255, 106, 139, 0) 60%);
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
  background: linear-gradient(120deg, #fff4e6, #ff9cae 55%, #ffd98a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow:
    0 0 14px rgba(255, 176, 176, 0.6),
    0 4px 18px rgba(0, 0, 0, 0.45);
}

.indicator-stripe {
  position: absolute;
  top: 54%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(72vw, 520px);
  height: 6px;
  background: linear-gradient(90deg, transparent, #ff6a8b 30%, #ffd166 50%, #ff6a8b 70%, transparent);
  opacity: 0.9;
  filter: drop-shadow(0 0 10px rgba(255, 122, 155, 0.55));
}

@keyframes enemyTurnFlash {
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
  .enemy-turn-demo {
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
