<!--
EnemyActionChip
===============
敵の次アクションを1チップ表示する小コンポーネント。スタイルは EnemyCard の chip と一致させる。
ホバー時のツールチップ表示は親で行うため、マウスイベントをそのまま親へ委譲する。
-->
<script setup lang="ts">
interface SegmentEntry {
  text: string
  highlighted?: boolean
}

interface ActionChipEntry {
  key: string
  icon: string
  segments: SegmentEntry[]
  label: string
  description: string
  tooltips: Partial<Record<number, string>>
  tooltipKey: string
  disabled: boolean
}

const props = defineProps<{
  action: ActionChipEntry
}>()

const emit = defineEmits<{
  (event: 'enter', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'move', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'leave', payload: { key: string }): void
}>()
</script>

<template>
  <li
    class="enemy-card__chip"
    :class="{ 'enemy-card__chip--disabled': props.action.disabled }"
    @mouseleave="() => emit('leave', { key: props.action.tooltipKey })"
  >
    <span v-if="props.action.icon" class="enemy-card__chip-icon">{{ props.action.icon }}</span>
    <span class="enemy-card__chip-text">
      <span
        v-for="(segment, segmentIndex) in props.action.segments"
        :key="segmentIndex"
        :class="{ 'value--boosted': segment.highlighted }"
        @mouseenter="(event) => emit('enter', { event, text: props.action.tooltips[segmentIndex], key: props.action.tooltipKey })"
        @mousemove="(event) => emit('move', { event, text: props.action.tooltips[segmentIndex], key: props.action.tooltipKey })"
        @mouseleave="() => emit('leave', { key: props.action.tooltipKey })"
      >
        {{ segment.text }}
      </span>
    </span>
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

.enemy-card__chip--disabled {
  opacity: 0.45;
  filter: grayscale(0.5);
}

.enemy-card__chip-icon {
  font-size: 13px;
}

.enemy-card__chip-text {
  display: inline-flex;
  gap: 2px;
}
</style>
