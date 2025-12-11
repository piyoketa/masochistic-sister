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
  iconPath?: string
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

const DEBUFF_ICON_SRC = '/assets/icons/debuff.png'
const SINGLE_ATTACK_ICON_SRC = '/assets/icons/single_attack.png'
const MULTI_ATTACK_ICON_SRC = '/assets/icons/multi_attack.png'
const BUFF_ICON_SRC = '/assets/icons/buff.png'

function isDebuff(text: string): boolean {
  return text.startsWith('🌀')
}

function stripDebuff(text: string): string {
  return text.replace(/^🌀/, '')
}

function isSingleAttackIcon(text: string): boolean {
  return text === '💥'
}

function isMultiAttackIcon(text: string): boolean {
  return text === '⚔️'
}

function isBuff(text: string): boolean {
  return text.startsWith('🔱')
}

function stripBuff(text: string): string {
  return text.replace(/^🔱/, '')
}

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
        <template v-if="segment.iconPath">
          <v-icon class="effect-icon" size="14">
            <img :src="segment.iconPath" alt="効果" />
          </v-icon>
          <span class="effect-text">{{ segment.text }}</span>
        </template>
        <template v-else-if="isSingleAttackIcon(segment.text)">
          <v-icon class="attack-icon" size="16">
            <img :src="SINGLE_ATTACK_ICON_SRC" alt="一回攻撃" />
          </v-icon>
        </template>
        <template v-else-if="isMultiAttackIcon(segment.text)">
          <v-icon class="attack-icon" size="16">
            <img :src="MULTI_ATTACK_ICON_SRC" alt="連続攻撃" />
          </v-icon>
        </template>
        <template v-else-if="isBuff(segment.text)">
          <v-icon class="buff-icon" size="14">
            <img :src="BUFF_ICON_SRC" alt="バフ" />
          </v-icon>
          <span class="buff-text">{{ stripBuff(segment.text) }}</span>
        </template>
        <template v-else-if="isDebuff(segment.text)">
          <v-icon class="debuff-icon" size="14">
            <img :src="DEBUFF_ICON_SRC" alt="デバフ" />
          </v-icon>
          <span class="debuff-text">{{ stripDebuff(segment.text) }}</span>
        </template>
        <template v-else>
          {{ segment.text }}
        </template>
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
  max-width: 200px;
  flex-wrap: wrap;
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
  flex-wrap: wrap;
  line-height: 1.2;
}

.value--changed {
  font-weight: 700;
}
.enemy-card__chip-text span {
  white-space: normal;
}

.debuff-icon {
  display: inline-flex;
}

.debuff-icon img {
  width: 14px;
  height: 14px;
}

.debuff-text {
  display: inline-flex;
}

.effect-icon {
  display: inline-flex;
}

.effect-icon img {
  width: 14px;
  height: 14px;
}

.effect-text {
  display: inline-flex;
}

.buff-icon {
  display: inline-flex;
}

.buff-icon img {
  width: 14px;
  height: 14px;
}

.buff-text {
  display: inline-flex;
}

.attack-icon {
  display: inline-flex;
}

.attack-icon img {
  width: 16px;
  height: 16px;
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
