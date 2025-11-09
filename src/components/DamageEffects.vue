<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { DamageOutcome } from '@/domain/entities/Damages'

const HIT_SOUND_URL = new URL('../../materials/sounds/振り回す1.mp3', import.meta.url).href
const AUDIO_SUPPORTED = typeof window !== 'undefined' && typeof window.Audio === 'function'

const props = defineProps<{
  outcomes: DamageOutcome[]
  interval?: number
  duration?: number
}>()

const emit = defineEmits<{
  (event: 'sequence-start'): void
  (event: 'damage-step', payload: { amount: number; index: number }): void
  (event: 'sequence-end'): void
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
const activeSounds = new Set<HTMLAudioElement>()

function reset(): void {
  while (timers.length > 0) {
    const timer = timers.pop()
    if (timer !== undefined) {
      clearTimeout(timer)
    }
  }
  entries.value = []
  displayedCount = 0
  activeSounds.forEach((audio) => {
    if (typeof audio.pause === 'function') {
      try {
        audio.pause()
      } catch {
        // ignore
      }
    }
    audio.currentTime = 0
  })
  activeSounds.clear()
}

function playHitSound(): void {
  if (!AUDIO_SUPPORTED) {
    return
  }
  const audio = new Audio(HIT_SOUND_URL)
  audio.volume = 0.8
  audio.addEventListener(
    'ended',
    () => {
      activeSounds.delete(audio)
    },
    { once: true },
  )
  audio.addEventListener(
    'pause',
    () => {
      activeSounds.delete(audio)
    },
    { once: true },
  )
  activeSounds.add(audio)
  if (typeof audio.play === 'function') {
    try {
      const playResult = audio.play()
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {
          activeSounds.delete(audio)
        })
      }
    } catch {
      activeSounds.delete(audio)
    }
  } else {
    activeSounds.delete(audio)
  }
}

function scheduleRemoval(entryId: number, delay: number, totalEntries: number): void {
  const timer = window.setTimeout(() => {
    entries.value = entries.value.filter((entry) => entry.id !== entryId)
    if (entries.value.length === 0 && displayedCount >= totalEntries) {
      emit('sequence-end')
    }
  }, delay)
  timers.push(timer)
}

function play(): void {
  reset()
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
      playHitSound()
      scheduleRemoval(entry.id, props.duration ?? 800, props.outcomes.length)
    }, appearDelay)
    timers.push(timer)
  })
}

defineExpose({ play })
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
      :style="{ transform: `translate(calc(-50% + ${entry.offsetX}px), 0)` }"
    >
      {{ entry.amount }}
    </span>
  </div>
</template>

<style scoped>
.damage-effects {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.damage-effects__item {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  color: #ffdf85;
  font-size: 32px;
  font-weight: 700;
  text-shadow:
    0 2px 6px rgba(0, 0, 0, 0.65),
    0 0 2px rgba(0, 0, 0, 0.8);
  -webkit-text-stroke: 1px rgba(0, 0, 0, 0.5);
  animation: damage-rise 0.8s ease forwards;
}

.damage-effects__item--guarded {
  color: #88d8ff;
}

@keyframes damage-rise {
  0% {
    opacity: 1;
    transform: translate(-50%, 0) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -60px) scale(0.85);
  }
}
</style>
