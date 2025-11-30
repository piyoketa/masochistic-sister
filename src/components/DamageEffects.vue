<!--
  Component: DamageEffects
  責務: ダメージ演出の数字と効果音をまとめて再生し、表示タイミングを管理する。外部から渡された DamageOutcome 配列を順に処理し、視覚・聴覚的なフィードバックを提供する。
  非責務: 戦闘ロジックの判断やダメージ計算の変更は行わない。DamageOutcome の生成やバリデーションは親側で完結させる。
  主な通信相手とインターフェース:
    - 親コンポーネント: props.outcomes(DamageOutcome[])を受け取り、emit で sequence-start / damage-step({amount:number,index:number}) / sequence-end / audio-ready-change(boolean) を通知する。DamageOutcome は effectType? と damage:number を含む値で、描画と効果音の決定に使う。類似する型として Battle 内部の Damages などがあるが、本コンポーネントでは描画に必要な最小限のみ参照し、状態遷移は扱わない。
    - オーディオプリローダ: preloadAudioAssets / getPreloadedAudio を呼び出し、音声の準備状況を管理する。ここではプリロードの成否のみを扱い、実際の戦闘進行には影響を与えない。
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { DamageOutcome } from '@/domain/entities/Damages'
import { resolveDamageSound, resolveDefaultSound } from '@/utils/damageSounds'
import { useAudioStore } from '@/stores/audioStore'

const AUDIO_SUPPORTED = typeof window !== 'undefined' && typeof window.Audio === 'function'
const debugEnv =
  typeof import.meta !== 'undefined' &&
  typeof import.meta.env !== 'undefined' &&
  import.meta.env?.VITE_DEBUG_DAMAGE_EFFECTS === 'true'

const props = defineProps<{
  outcomes: DamageOutcome[]
  interval?: number
  duration?: number
  debug?: boolean
}>()

const emit = defineEmits<{
  (event: 'sequence-start'): void
  (event: 'damage-step', payload: { amount: number; index: number }): void
  (event: 'damage-step-complete', payload: { amount: number; index: number }): void
  (event: 'sequence-end'): void
  (event: 'audio-ready-change', ready: boolean): void
}>()

type DamageEntry = {
  id: number
  amount: number
  effectType?: string
  offsetX: number
}

const entries = ref<DamageEntry[]>([])
const timers: number[] = []
let displayedCount = 0
const logs = ref<string[]>([])
const audioStore = useAudioStore()
const isReady = computed(() => audioStore.hub?.ready.value ?? false)
const debugEnabled = computed(() => debugEnv || Boolean(props.debug))

function appendLog(message: string): void {
  if (!debugEnabled.value) {
    return
  }
  const timestamp = new Date().toLocaleTimeString()
  logs.value = [...logs.value.slice(-30), `[${timestamp}] ${message}`]
}

function reset(): void {
  while (timers.length > 0) {
    const timer = timers.pop()
    if (timer !== undefined) {
      clearTimeout(timer)
    }
  }
  entries.value = []
  displayedCount = 0
}

function playHitSound(outcome: DamageOutcome): void {
  if (!AUDIO_SUPPORTED) {
    return
  }
  const sound =
    outcome.effectType !== undefined
      ? resolveDamageSound(outcome)
      : resolveDefaultSound(outcome.damage)
  if (debugEnabled.value) {
    console.info('[DamageEffects] play sound', sound)
  }

  audioStore.playSe(sound.src)
}

function scheduleRemoval(entryId: number, delay: number, totalEntries: number): void {
  const timer = window.setTimeout(() => {
    const removed = entries.value.find((entry) => entry.id === entryId)
    entries.value = entries.value.filter((entry) => entry.id !== entryId)
    if (removed) {
      const removedIndex = Math.max(0, displayedCount - entries.value.length - 1)
      emit('damage-step-complete', { amount: removed.amount, index: removedIndex })
    }
    if (entries.value.length === 0 && displayedCount >= totalEntries) {
      emit('sequence-end')
    }
  }, delay)
  timers.push(timer)
}

function play(): void {
  reset()
  startSequence()
}

function startSequence(): void {
  if (props.outcomes.length === 0) {
    emit('sequence-end')
    return
  }
  emit('sequence-start')

  props.outcomes.forEach((outcome, index) => {
    const appearDelay = index * (props.interval ?? 200)
    const timer = window.setTimeout(() => {
      const entry: DamageEntry = {
        id: Date.now() + index,
        amount: outcome.damage,
        effectType: outcome.effectType,
        offsetX: (Math.random() - 0.5) * 40,
      }
      entries.value = [...entries.value, entry]
      displayedCount += 1
      emit('damage-step', { amount: outcome.damage, index })
      playHitSound(outcome)
      appendLog(`damage=${outcome.damage} effectType=${outcome.effectType}`)
      scheduleRemoval(entry.id, props.duration ?? 1500, props.outcomes.length)
    }, appearDelay)
    timers.push(timer)
  })
}

defineExpose({ play, isReady })
onMounted(() => {
  watch(
    () => isReady.value,
    (ready) => {
      if (debugEnabled.value) {
        console.info('[DamageEffects] isReady computed', ready)
      }
      emit('audio-ready-change', ready)
    },
    { immediate: true },
  )
})
onBeforeUnmount(() => reset())
</script>

<template>
  <div class="damage-effects">
    <span
      v-for="entry in entries"
      :key="entry.id"
      class="damage-effects__item"
      :class="[
        entry.effectType === 'guarded' ? 'damage-effects__item--guarded' : '',
      ]"
      :style="{ '--offset-x': `${entry.offsetX}px` }"
    >
      {{ entry.amount }}
    </span>
    <div v-if="debugEnabled || false" class="damage-effects__log">
      <p v-for="line in logs" :key="line">{{ line }}</p>
    </div>
  </div>
</template>

<style scoped>
.damage-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.preload-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 21px;
  pointer-events: auto;
  z-index: 5;
}

.damage-effects__item {
  position: absolute;
  left: 50%;
  bottom: 0;
  --offset-x: 0px;
  color: #8b1c1c;
  font-size: 72px;
  font-weight: 700;
  text-shadow:
    0 2px 8px rgba(0, 0, 0, 0.7),
    0 0 4px rgba(0, 0, 0, 0.85);
  -webkit-text-stroke: 2px #ffffff;
  animation: damage-rise 0.7s cubic-bezier(0.25, 0.8, 0.3, 1.05) forwards;
}

.damage-effects__item--guarded {
  color: #88d8ff;
}

.damage-effects__log {
  position: absolute;
  left: 16px;
  bottom: 16px;
  pointer-events: auto;
  max-height: 100px;
  overflow: auto;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.75);
  text-align: left;
}

@keyframes damage-rise {
  0% {
    opacity: 1;
    transform: translate(calc(-50% + var(--offset-x, 0px)), 0) scale(1.2);
  }
  35% {
    opacity: 1;
    transform: translate(calc(-50% + var(--offset-x, 0px) + 24px), -68px) scale(1.05);
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--offset-x, 0px) + 44px), 88px) scale(0.85);
  }
}
</style>
