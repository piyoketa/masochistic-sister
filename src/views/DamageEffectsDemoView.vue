<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DamageEffects from '@/components/DamageEffects.vue'
import HpGauge from '@/components/HpGauge.vue'
import type { DamageOutcome } from '@/domain/entities/Damages'

const maxHp = 120
const currentHp = ref(maxHp)
interface Scenario {
  id: string
  label: string
  description: string
  outcomes: DamageOutcome[]
}

const scenarios: Scenario[] = [
  {
    id: 'slash',
    label: 'Slash Combo',
    description: '連続攻撃（slash）4段',
    outcomes: [
      { damage: 8, effectType: 'slash' },
      { damage: 12, effectType: 'slash' },
      { damage: 18, effectType: 'slash' },
      { damage: 24, effectType: 'slash' },
    ],
  },
  {
    id: 'slam',
    label: 'Slam Heavy',
    description: '単発たいあたり（slam）',
    outcomes: [{ damage: 28, effectType: 'slam' }],
  },
  {
    id: 'spit',
    label: 'Spit / Acid',
    description: '粘液・酸タイプ（spit）',
    outcomes: [
      { damage: 10, effectType: 'spit' },
      { damage: 6, effectType: 'spit' },
    ],
  },
  {
    id: 'poison',
    label: 'Poison Sting',
    description: '毒攻撃（poison）',
    outcomes: [{ damage: 5, effectType: 'poison' }],
  },
  {
    id: 'default',
    label: 'Fallback (no effectType)',
    description: 'effectType 未指定のデフォルト動作',
    outcomes: [
      { damage: 14, effectType: 'default' },
      { damage: 6, effectType: 'default' },
    ],
  },
]

const selectedScenarioId = ref(scenarios[0]?.id ?? '')
const selectedScenario = computed(() => scenarios.find((scenario) => scenario.id === selectedScenarioId.value) ?? scenarios[0])

const outcomes = ref<DamageOutcome[]>(selectedScenario.value?.outcomes ?? [])

const effectsRef = ref<InstanceType<typeof DamageEffects> | null>(null)

function handleDamageStep(payload: { amount: number }): void {
  currentHp.value = Math.max(0, currentHp.value - payload.amount)
}

function playSequence(): void {
  currentHp.value = maxHp
  effectsRef.value?.play()
}

const audioSupported = typeof window !== 'undefined' && typeof window.Audio === 'function'
console.info('[DamageEffectsDemo] audioSupported=', audioSupported)
const exposedReady = ref(false)

watch(
  () => effectsRef.value,
  (value) => {
    console.info('[DamageEffectsDemo] effectsRef changed', Boolean(value))
    const readyValue = resolveDamageEffectsReady(value)
    if (readyValue !== undefined) {
      console.info('[DamageEffectsDemo] effectsRef expose isReady value', readyValue)
    }
  },
  { immediate: true },
)

const handleAudioReadyChange = (ready: boolean) => {
  console.info('[DamageEffectsDemo] audio-ready-change event', ready)
  exposedReady.value = ready
}

const isAudioReady = computed(() => {
  if (!audioSupported) {
    return true
  }
  return exposedReady.value
})

watch(
  selectedScenario,
  (scenario) => {
    if (scenario) {
      outcomes.value = scenario.outcomes
    }
  },
  { immediate: true },
)

function resolveDamageEffectsReady(target: InstanceType<typeof DamageEffects> | null): boolean | undefined {
  if (!target) {
    return undefined
  }
  return typeof target.isReady === 'boolean' ? target.isReady : undefined
}
</script>

<template>
  <div class="damage-demo">
    <header class="demo-header">
      <h1>Damage Effects Demo</h1>
      <p>シナリオを選択して再生すると、ダメージ演出と効果音の組み合わせを確認できます。</p>
    </header>
    <section class="scenario-panel">
      <h2>Scenarios</h2>
      <ul class="scenario-list">
        <li
          v-for="scenario in scenarios"
          :key="scenario.id"
          :class="['scenario-entry', scenario.id === selectedScenarioId ? 'scenario-entry--active' : '']"
        >
          <button type="button" @click="selectedScenarioId = scenario.id">
            <strong>{{ scenario.label }}</strong>
            <span>{{ scenario.description }}</span>
          </button>
        </li>
      </ul>
    </section>
    <div class="demo-stage">
      <HpGauge :current="currentHp" :max="maxHp" />
      <DamageEffects ref="effectsRef" :outcomes="outcomes" @damage-step="handleDamageStep" @audio-ready-change="handleAudioReadyChange" />
      <button type="button" class="play-button" :disabled="!isAudioReady" @click="playSequence">
        {{ isAudioReady ? 'Play' : 'Loading...' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.damage-demo {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px;
  color: #fefefe;
}

.demo-header h1 {
  margin: 0;
  font-size: 24px;
}

.demo-header p {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.8);
}

.scenario-panel {
  padding: 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.scenario-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.scenario-entry button {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.35);
  color: inherit;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
}

.scenario-entry--active button {
  border-color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.12);
}

.demo-stage {
  position: relative;
  height: 220px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.4));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}

.play-button {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: inherit;
  cursor: pointer;
}

.play-button:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
