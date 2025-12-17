<!--
EnemyActionChip
===============
敵の次アクションを1チップ表示する小コンポーネント。スタイルは EnemyCard の chip と一致させる。
ダメージ量の変動やカードオーバーレイ（ActionCardOverlay）表示を含め、hoverイベントを親へ委譲しつつ必要時は自前でオーバーレイを操作する。
-->
<script setup lang="ts">
import { useActionCardOverlay } from '@/composables/actionCardOverlay'
import { useImageHub } from '@/composables/imageHub'

import type { EnemyActionChipViewModel, EnemyActionChipSegment } from '@/types/enemyActionChip'
import { formatEnemyActionChipsForView, type EssentialEnemyActionHint } from '@/view/enemyActionHintsForView'

const props = defineProps<{
  action: EssentialEnemyActionHint
}>()

const SINGLE_ATTACK_ICON_SRC = '/assets/icons/single_attack.png'
const MULTI_ATTACK_ICON_SRC = '/assets/icons/multi_attack.png'

function isSingleAttackIcon(text: string): boolean {
  return text === '💥'
}

function isMultiAttackIcon(text: string): boolean {
  return text === '⚔️'
}

const emit = defineEmits<{
  (event: 'enter', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'move', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'leave', payload: { key: string }): void
}>()

const chip = computed<EnemyActionChipViewModel>(() => {
  if ('segments' in props.action) {
    return props.action as EnemyActionChipViewModel
  }
  const vm = formatEnemyActionChipsForView(0, [props.action as EssentialEnemyActionHint], { includeTitle: false })[0]
  return vm
})

const actionOverlay = useActionCardOverlay()
const imageHub = useImageHub()

function resolveIconSrc(path?: string): string | undefined {
  if (!path) return undefined
  // ImageHub経由で正規化＋キャッシュ済みのImageを確保しておき、毎回生パスを直参照しない。
  imageHub.getElement(path)
  return imageHub.getSrc(path)
}

function handleEnter(segmentIndex: number, event: MouseEvent): void {
  const segment = chip.value.segments[segmentIndex]
  if (segment?.showOverlay && chip.value.cardInfo) {
    actionOverlay.show(chip.value.cardInfo, { x: event.clientX, y: event.clientY })
    return
  }
  emit('enter', { event, text: segment.tooltip, key: chip.value.key })
}

function handleMove(segmentIndex: number, event: MouseEvent): void {
  const segment = chip.value.segments[segmentIndex]
  if (segment?.showOverlay && chip.value.cardInfo) {
    actionOverlay.updatePosition({ x: event.clientX, y: event.clientY })
    return
  }
  emit('move', { event, text: segment.tooltip, key: chip.value.key })
}

function handleLeave(): void {
  actionOverlay.hide()
  emit('leave', { key: chip.value.key })
}
</script>

<template>
  <li
    class="enemy-card__chip"
    :class="{ 'enemy-card__chip--disabled': chip.disabled }"
    @mouseleave="handleLeave"
  >
    <span v-if="chip.icon" class="enemy-card__chip-icon">{{ chip.icon }}</span>
    <span class="enemy-card__chip-text">
      <span
        v-for="(segment, segmentIndex) in chip.segments"
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
        <template v-if="resolveIconSrc(segment.iconPath)">
          <v-icon class="effect-icon" size="14">
            <img :src="resolveIconSrc(segment.iconPath)" alt="効果" />
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
