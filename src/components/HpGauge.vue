<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    current: number
    max: number
    /** 予測HP（ターン終了後などの見込み値）。指定された場合、現在値との差分を警告表示する。 */
    predicted?: number | null
  }>(),
  {
    predicted: null,
  },
)

const percent = computed(() => {
  if (props.max <= 0) {
    return 0
  }
  return Math.min(100, Math.max(0, (props.current / props.max) * 100))
})

const predictedPercent = computed(() => {
  if (props.max <= 0 || props.predicted === null || props.predicted === undefined) {
    return null
  }
  return Math.min(100, Math.max(0, (props.predicted / props.max) * 100))
})

const warningRange = computed(() => {
  // 予測HPが現在より小さい場合のみ、差分区間を警告表示する
  if (predictedPercent.value === null || predictedPercent.value >= percent.value) {
    return null
  }
  return {
    left: predictedPercent.value,
    width: percent.value - predictedPercent.value,
  }
})

const displayValue = computed(() => `${Math.max(0, props.current)} / ${Math.max(0, props.max)}`)

const predictedDisplay = computed(() => {
  if (props.predicted === null || props.predicted === undefined) return null
  return Math.max(0, props.predicted)
})

const showPredictedText = computed(
  () => predictedDisplay.value !== null && predictedDisplay.value < props.current,
)
</script>

<template>
  <div class="hp-gauge" role="status" aria-live="polite" aria-label="現在の体力">
    <div class="hp-track">
      <div class="hp-fill" :style="{ width: `${percent}%` }" />
      <div
        v-if="warningRange"
        class="hp-warning"
        :style="{ left: `${warningRange.left}%`, width: `${warningRange.width}%` }"
      />
    </div>
    <span class="hp-text">{{ displayValue }}</span>
    <!-- <span v-if="showPredictedText" class="hp-text hp-text--predicted">→ {{ predictedDisplay }}</span> -->
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

.hp-warning {
  position: absolute;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(255, 214, 102, 0.9), rgba(255, 189, 46, 0.9));
  animation: hp-warning-blink 1s ease-in-out infinite;
  box-shadow: 0 0 6px rgba(255, 214, 102, 0.8);
}

@keyframes hp-warning-blink {
  0% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.9;
  }
  100% {
    opacity: 0.35;
  }
}

.hp-text {
  position: relative;
  z-index: 1;
  font-size: 13px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.hp-text--predicted {
  margin-left: 8px;
  color: #ffd666;
  font-weight: 700;
}
</style>
