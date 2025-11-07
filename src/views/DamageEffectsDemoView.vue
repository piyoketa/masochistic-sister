<script setup lang="ts">
import { ref } from 'vue'
import DamageEffects from '@/components/DamageEffects.vue'
import HpGauge from '@/components/HpGauge.vue'
import type { DamageOutcome } from '@/domain/entities/Damages'

const maxHp = 120
const currentHp = ref(maxHp)
const outcomes = ref<DamageOutcome[]>([
  { damage: 12, effectType: 'slash' },
  { damage: 18, effectType: 'slash' },
  { damage: 24, effectType: 'slash' },
])

const effectsRef = ref<InstanceType<typeof DamageEffects> | null>(null)

function handleDamageStep(payload: { amount: number }): void {
  currentHp.value = Math.max(0, currentHp.value - payload.amount)
}

function playSequence(): void {
  currentHp.value = maxHp
  effectsRef.value?.play()
}
</script>

<template>
  <div class="damage-demo">
    <header class="demo-header">
      <h1>Damage Effects Demo</h1>
      <p>コンポーネントをクリックすると、被ダメージ演出が再生されます。</p>
    </header>
    <div class="demo-stage" @click="playSequence">
      <HpGauge :current="currentHp" :max="maxHp" />
      <DamageEffects
        ref="effectsRef"
        :outcomes="outcomes"
        @damage-step="handleDamageStep"
      />
      <button type="button" class="play-button">Play</button>
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

.demo-stage {
  position: relative;
  height: 220px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.05), rgba(0, 0, 0, 0.4));
  display: flex;
  align-items: flex-end;
  justify-content: center;
  cursor: pointer;
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
