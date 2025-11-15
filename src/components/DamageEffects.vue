<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { DamageOutcome } from '@/domain/entities/Damages'
import { getPreloadedAudio, preloadAudioAssets } from '@/utils/audioPreloader'
import { damageSoundAssets, resolveDamageSound, resolveDefaultSound } from '@/utils/damageSounds'

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
const activeSounds = new Set<HTMLAudioElement>()
const preloadState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
const preloadError = ref<string | null>(null)
const logs = ref<string[]>([])
const isReady = computed(() => preloadState.value === 'ready')

function appendLog(message: string): void {
  const timestamp = new Date().toLocaleTimeString()
  logs.value = [...logs.value.slice(-30), `[${timestamp}] ${message}`]
}

async function ensureAudioPreloaded(): Promise<void> {
  if (!AUDIO_SUPPORTED) {
    return
  }
  if (preloadState.value === 'ready' || preloadState.value === 'loading') {
    console.info('[DamageEffects] preload skipped, state=', preloadState.value)
    return
  }
  try {
    preloadState.value = 'loading'
    console.info('[DamageEffects] preload start')
    await preloadAudioAssets(damageSoundAssets)
    preloadState.value = 'ready'
    preloadError.value = null
    console.info('[DamageEffects] preload ready')
  } catch (error) {
    preloadState.value = 'error'
    preloadError.value = error instanceof Error ? error.message : String(error)
    console.error('[DamageEffects] preload error', error)
  }
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

function playHitSound(outcome: DamageOutcome): void {
  if (!AUDIO_SUPPORTED) {
    return
  }
  const sound =
    outcome.effectType !== undefined
      ? resolveDamageSound(outcome)
      : resolveDefaultSound(outcome.damage)
  console.info('[DamageEffects] play sound', sound)

  const baseAudio = getPreloadedAudio(sound.id)
  const audio = baseAudio ? (baseAudio.cloneNode(true) as HTMLAudioElement) : new Audio(sound.src)
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
        playResult.catch((error) => {
          console.error('[DamageEffects] audio play rejected', error)
          activeSounds.delete(audio)
        })
      }
    } catch (error) {
      console.error('[DamageEffects] audio play error', error)
      activeSounds.delete(audio)
    }
  } else {
    activeSounds.delete(audio)
  }
  audio.addEventListener('error', (event) => {
    console.error('[DamageEffects] audio error event', event)
  })
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
  ensureAudioPreloaded().catch(() => {})
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
      scheduleRemoval(entry.id, props.duration ?? 800, props.outcomes.length)
    }, appearDelay)
    timers.push(timer)
  })
}

defineExpose({ play, isReady })
onMounted(() => {
  console.info('[DamageEffects] mounted, starting preload')
  ensureAudioPreloaded().catch((error) => {
    console.error('[DamageEffects] preload failure', error)
  })
  watch(
    () => preloadState.value,
    (state) => {
      console.info('[DamageEffects] preloadState changed', state)
    },
    { immediate: true },
  )
  watch(
    () => isReady.value,
    (ready) => {
      console.info('[DamageEffects] isReady computed', ready)
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
      :style="{ transform: `translate(calc(-50% + ${entry.offsetX}px), 0)` }"
    >
      {{ entry.amount }}
    </span>
    <div class="damage-effects__log">
      <p>
        効果音: <strong>{{ preloadState }}</strong>
        <span v-if="preloadError"> ({{ preloadError }})</span>
      </p>
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
  font-size: 14px;
  pointer-events: auto;
  z-index: 5;
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

.damage-effects__log {
  position: absolute;
  left: 16px;
  bottom: 16px;
  pointer-events: auto;
  max-height: 100px;
  overflow: auto;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  text-align: left;
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
