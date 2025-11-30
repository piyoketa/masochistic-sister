<!--
EnemyStateChip
==============
敵ステートのチップ表示専用コンポーネント。リスト内で1要素として表示し、hoverイベントを親へ委譲する。
責務: 表示とホバーイベントの発火。ツールチップ表示は親コンポーネント側で行う。
-->
<script setup lang="ts">
const props = defineProps<{
  chip: {
    key: string
    label: string
    description: string
    isImportant?: boolean
  }
}>()

const emit = defineEmits<{
  (event: 'enter', ev: MouseEvent): void
  (event: 'move', ev: MouseEvent): void
  (event: 'leave'): void
}>()
</script>

<template>
  <li
    class="enemy-card__chip"
    :class="['enemy-card__chip--plain', { 'enemy-card__chip--important': props.chip.isImportant }]"
    @mouseenter="(ev) => emit('enter', ev)"
    @mousemove="(ev) => emit('move', ev)"
    @mouseleave="() => emit('leave')"
  >
    {{ props.chip.label }}
  </li>
</template>

<style scoped>
.enemy-card__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.88);
  position: relative;
  transition: opacity 0.5s ease, filter 0.5s ease;
}

.enemy-card__chip--plain {
  background: rgba(255, 255, 255, 0.05);
}

.enemy-card__chip--important {
  position: relative;
  color: inherit;
  border: 2px solid transparent;
  background-clip: padding-box, border-box;
  background-origin: padding-box, border-box;
  overflow: visible;
  --gradient-angle: 0turn;
  z-index: 0;
  background: rgba(255, 255, 255, 0.05);
}

.enemy-card__chip--important::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 999px;
  background-image: conic-gradient(
    from var(--gradient-angle),
    rgba(30, 8, 10, 0) 0deg,
    rgba(30, 8, 10, 0) 330deg,
    rgba(120, 40, 45, 0.4) 342deg,
    rgba(255, 92, 92, 0.7) 344deg,
    rgba(120, 40, 45, 0.4) 346deg,
    rgba(30, 8, 10, 0) 360deg
  );
  /* 中央は透明で枠のみ光らせる */
  /* mask: radial-gradient(circle, transparent 60%, black 62%);
  -webkit-mask: radial-gradient(circle, transparent 60%, black 62%); */
  opacity: 0;
  animation: gradient-angle 3s infinite linear;
  pointer-events: none;
  z-index: 1;
}

.enemy-card__chip--important::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: transparent;
  pointer-events: none;
  z-index: 0;
}

@property --gradient-angle {
  syntax: '<angle>';
  initial-value: 0turn;
  inherits: false;
}

@keyframes gradient-angle {
  0% {
    --gradient-angle: 0turn;
    opacity: 0;
  }
  8% {
    opacity: 1;
  }
  33% {
    --gradient-angle: 1turn;
    opacity: 1;
  }
  45% {
    opacity: 0;
  }
  to {
    --gradient-angle: 1turn;
    opacity: 0;
  }
}
</style>
