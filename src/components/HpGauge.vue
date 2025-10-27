<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  current: number
  max: number
}>()

const percent = computed(() => {
  if (props.max <= 0) {
    return 0
  }
  return Math.min(100, Math.max(0, (props.current / props.max) * 100))
})

const displayValue = computed(() => `${Math.max(0, props.current)} / ${Math.max(0, props.max)}`)
</script>

<template>
  <div class="hp-gauge" role="status" aria-live="polite" aria-label="現在の体力">
    <div class="hp-track">
      <div class="hp-fill" :style="{ width: `${percent}%` }" />
    </div>
    <span class="hp-text">{{ displayValue }}</span>
  </div>
</template>

<style scoped>
.hp-gauge {
  position: relative;
  width: 100%;
  height: 28px;
  font-weight: 600;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
}

.hp-track {
  position: absolute;
  left: 0;
  right: 0;
  height: 5px;
  border-radius: 999px;
  background: #050505;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.5);
  top: 50%;
  transform: translateY(-50%);
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #7a1015, #d42028);
  transition: width 180ms ease;
}

.hp-text {
  position: relative;
  z-index: 1;
  font-size: 13px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}
</style>
