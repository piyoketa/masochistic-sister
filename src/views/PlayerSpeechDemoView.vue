<!--
PlayerSpeechDemoView の責務:
- プレイヤー頭上の発話テキスト演出をデモ表示し、入力→送信→表示の流れを確認できる場を提供する。
- デモ用の発話キューを保持し、PlayerCardComponent へ表示テキストとキーを渡す。

責務ではないこと:
- 戦闘ロジックやダメージ計算の適用、AnimationInstruction の実処理は行わない。
- 発話の永続化やサーバ同期は扱わない。

主な通信相手とインターフェース:
- PlayerCardComponent: `speechText` と `speechKey` を props で渡し、頭上テキストの表示を制御する。
  受け渡すのは表示文字列(string)と、同一文言の再生用のキー(number)のみで、BattleSnapshot 等の状態更新は扱わない。
- PlayerStore: `stateProgressCount` / `appliedDamageExpressions` / `faceExpressionLevel` を参照し、戦闘外でも現在の状態進行を表示に反映する。
-->
<script setup lang="ts">
import { onBeforeUnmount, ref, computed } from 'vue'
import PlayerCardComponent from '@/components/PlayerCardComponent.vue'
import type { DamageOutcome } from '@/domain/entities/Damages'
import { usePlayerStore } from '@/stores/playerStore'

type SpeechSource = 'demo' | 'animation-instruction'
type SpeechEntry = {
  id: number
  text: string
  durationMs: number
  source: SpeechSource
}

const DEFAULT_DURATION_MS = 5000
const CAPTION_TRANSITION_MS = 260
const inputText = ref('念のために\n薬を出しておくわ')
const speechQueue = ref<SpeechEntry[]>([])
const activeSpeech = ref<SpeechEntry | null>(null)
const autoHideTimerId = ref<number | null>(null)
const leaveTimerId = ref<number | null>(null)
const dummyOutcomes: DamageOutcome[] = []
const playerStore = usePlayerStore()
playerStore.ensureInitialized()

const activeSpeechText = computed(() => activeSpeech.value?.text ?? '')
const activeSpeechKey = computed(() => activeSpeech.value?.id ?? null)

function enqueueSpeechFromInput(): void {
  const text = inputText.value.trim()
  if (!text) {
    return
  }
  enqueueSpeech(text, DEFAULT_DURATION_MS, 'demo')
}

// 設計判断: AnimationInstruction からの発話も同じキューに流し込み、
// デモ入力と競合せず順番に表示できるようにする。
function enqueueSpeech(text: string, durationMs: number, source: SpeechSource): void {
  const entry: SpeechEntry = {
    id: Date.now() + Math.random(),
    text,
    durationMs,
    source,
  }
  speechQueue.value.push(entry)
  showNextSpeechIfIdle()
}

// AnimationInstruction 連携時は、この関数に text/duration を渡す想定。
function enqueueSpeechFromInstruction(text: string, durationMs: number = DEFAULT_DURATION_MS): void {
  enqueueSpeech(text, durationMs, 'animation-instruction')
}

function showNextSpeechIfIdle(): void {
  if (activeSpeech.value || speechQueue.value.length === 0) {
    return
  }
  const next = speechQueue.value.shift() ?? null
  if (!next) {
    return
  }
  activeSpeech.value = next
  scheduleSpeechHide(next.durationMs)
}

function scheduleSpeechHide(durationMs: number): void {
  clearTimer(autoHideTimerId)
  autoHideTimerId.value = window.setTimeout(() => {
    activeSpeech.value = null
    scheduleNextAfterLeave()
  }, durationMs)
}

function scheduleNextAfterLeave(): void {
  clearTimer(leaveTimerId)
  leaveTimerId.value = window.setTimeout(() => {
    showNextSpeechIfIdle()
  }, CAPTION_TRANSITION_MS)
}

function clearTimer(target: typeof autoHideTimerId | typeof leaveTimerId): void {
  if (target.value !== null) {
    clearTimeout(target.value)
    target.value = null
  }
}

onBeforeUnmount(() => {
  clearTimer(autoHideTimerId)
  clearTimer(leaveTimerId)
})
</script>

<template>
  <div class="speech-demo">
    <header class="speech-demo__header">
      <p class="speech-demo__kicker">Player Speech Demo</p>
      <h1 class="speech-demo__title">プレイヤー頭上テキスト</h1>
      <p class="speech-demo__lead">
        入力したテキストを送信すると、5秒だけプレイヤー頭上に表示されます。
      </p>
    </header>
    <main class="speech-demo__layout">
      <section class="speech-demo__panel">
        <label class="speech-demo__label" for="speech-text">発話テキスト</label>
        <textarea
          id="speech-text"
          v-model="inputText"
          class="speech-demo__textarea"
          rows="4"
          placeholder="例: 念のために&#10;薬を出しておくわ"
        />
        <div class="speech-demo__actions">
          <button class="speech-demo__button" type="button" @click="enqueueSpeechFromInput">
            送信
          </button>
          <button
            class="speech-demo__button speech-demo__button--ghost"
            type="button"
            @click="enqueueSpeechFromInstruction('バックエンドからの発話サンプル')"
          >
            Instruction疑似
          </button>
        </div>
        <p class="speech-demo__hint">
          送信中でもキューに積まれ、順番に表示されます。
        </p>
      </section>
      <section class="speech-demo__stage">
        <div class="speech-demo__frame">
          <PlayerCardComponent
            :pre-hp="{ current: 30, max: 30 }"
            :post-hp="{ current: 30, max: 30 }"
            :outcomes="dummyOutcomes"
            :speech-text="activeSpeechText"
            :speech-key="activeSpeechKey"
            :state-progress-count="playerStore.stateProgressCount"
            :damage-expressions="playerStore.appliedDamageExpressions.map((entry) => entry.id)"
            :face-expression-level="playerStore.faceExpressionLevel"
            :show-hp-gauge="true"
            :show="true"
          />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.speech-demo {
  min-height: 100vh;
  padding: 40px 24px 80px;
  color: #f7f1e7;
  background:
    radial-gradient(circle at 20% 10%, rgba(255, 213, 168, 0.16), transparent 55%),
    radial-gradient(circle at 90% 20%, rgba(255, 119, 84, 0.12), transparent 60%),
    linear-gradient(180deg, #131017 0%, #0c0b12 55%, #0a0a10 100%);
}

.speech-demo__header {
  max-width: 720px;
  margin: 0 auto 32px;
}

.speech-demo__kicker {
  margin: 0 0 8px;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.28em;
  color: rgba(255, 245, 230, 0.6);
}

.speech-demo__title {
  margin: 0 0 12px;
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  font-size: 34px;
  letter-spacing: 0.08em;
}

.speech-demo__lead {
  margin: 0;
  max-width: 560px;
  color: rgba(255, 245, 230, 0.75);
  line-height: 1.6;
}

.speech-demo__layout {
  display: grid;
  grid-template-columns: minmax(240px, 360px) minmax(280px, 1fr);
  gap: 28px;
  max-width: 1000px;
  margin: 0 auto;
}

.speech-demo__panel {
  padding: 20px;
  border-radius: 16px;
  background: rgba(21, 17, 26, 0.72);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(8px);
}

.speech-demo__label {
  display: block;
  font-size: 13px;
  letter-spacing: 0.12em;
  color: rgba(255, 240, 220, 0.7);
  margin-bottom: 10px;
}

.speech-demo__textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid rgba(255, 216, 184, 0.3);
  background: rgba(8, 8, 14, 0.6);
  color: #fef7ec;
  font-family: 'Shippori Mincho', 'Noto Serif JP', serif;
  font-size: 16px;
  line-height: 1.5;
  resize: vertical;
}

.speech-demo__actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.speech-demo__button {
  padding: 10px 18px;
  border-radius: 999px;
  border: none;
  font-size: 14px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: linear-gradient(120deg, #f2d2a2, #f7b48a);
  color: #1a0f0d;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease;
  box-shadow: 0 12px 28px rgba(234, 171, 126, 0.28);
}

.speech-demo__button:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 34px rgba(234, 171, 126, 0.35);
}

.speech-demo__button--ghost {
  background: rgba(255, 220, 190, 0.12);
  color: #f7e9db;
  border: 1px solid rgba(255, 216, 184, 0.28);
  box-shadow: none;
}

.speech-demo__hint {
  margin: 16px 0 0;
  font-size: 12px;
  color: rgba(255, 238, 220, 0.6);
}

.speech-demo__stage {
  display: flex;
  align-items: center;
  justify-content: center;
}

.speech-demo__frame {
  padding: 24px 20px 60px;
  border-radius: 22px;
  background: rgba(12, 10, 18, 0.65);
  box-shadow:
    inset 0 0 18px rgba(255, 206, 160, 0.08),
    0 24px 50px rgba(0, 0, 0, 0.45);
}

@media (max-width: 860px) {
  .speech-demo__layout {
    grid-template-columns: 1fr;
  }

  .speech-demo__stage {
    justify-content: flex-start;
  }
}
</style>
