<!--
EnemyActionChip
===============
敵の次アクションを1チップ表示する小コンポーネント。スタイルは EnemyCard の chip と一致させる。
ダメージ量の変動やカードオーバーレイ（ActionCardOverlay）表示を含め、hoverイベントを親へ委譲しつつ必要時は自前でオーバーレイを操作する。
-->
<script setup lang="ts">
import { useActionCardOverlay } from '@/composables/actionCardOverlay'

interface SegmentEntry {
  text: string
  highlighted?: boolean
  change?: 'up' | 'down'
  showOverlay?: boolean
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
  cardInfo?: import('@/types/battle').CardInfo
}

const props = defineProps<{
  action: ActionChipEntry
}>()

const emit = defineEmits<{
  (event: 'enter', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'move', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'leave', payload: { key: string }): void
}>()

const actionOverlay = useActionCardOverlay()

function handleEnter(segmentIndex: number, event: MouseEvent): void {
  const segment = props.action.segments[segmentIndex]
  if (segment?.showOverlay && props.action.cardInfo) {
    actionOverlay.show(props.action.cardInfo, { x: event.clientX, y: event.clientY })
    return
  }
  emit('enter', { event, text: props.action.tooltips[segmentIndex], key: props.action.tooltipKey })
}

function handleMove(segmentIndex: number, event: MouseEvent): void {
  const segment = props.action.segments[segmentIndex]
  if (segment?.showOverlay && props.action.cardInfo) {
    actionOverlay.updatePosition({ x: event.clientX, y: event.clientY })
    return
  }
  emit('move', { event, text: props.action.tooltips[segmentIndex], key: props.action.tooltipKey })
}

function handleLeave(): void {
  actionOverlay.hide()
  emit('leave', { key: props.action.tooltipKey })
}
</script>

<template>
  <li
    class="enemy-card__chip"
    :class="{ 'enemy-card__chip--disabled': props.action.disabled }"
    @mouseleave="handleLeave"
  >
    <span v-if="props.action.icon" class="enemy-card__chip-icon">{{ props.action.icon }}</span>
    <span class="enemy-card__chip-text">
      <span
        v-for="(segment, segmentIndex) in props.action.segments"
        :key="segmentIndex"
        :class="{
          'value--boosted': segment.change === 'up',
          'value--reduced': segment.change === 'down',
          'value--changed': segment.highlighted,
        }"
        @mouseenter="(event) => handleEnter(segmentIndex, event)"
        @mousemove="(event) => handleMove(segmentIndex, event)"
        @mouseleave="handleLeave"
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

.value--changed {
  font-weight: 700;
}

.value--boosted {
  color: #1f8c68;
  text-shadow:
    0 0 6px rgba(31, 140, 104, 0.35),
    0 0 1px rgba(0, 0, 0, 0.6);
}

.value--reduced {
  color: #ff6b6b;
  text-shadow:
    0 0 6px rgba(255, 107, 107, 0.3),
    0 0 1px rgba(0, 0, 0, 0.6);
}
</style>
