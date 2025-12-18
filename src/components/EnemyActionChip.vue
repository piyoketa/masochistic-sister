<!--
EnemyActionChip
===============
敵の次アクションを1チップ表示する小コンポーネント。スタイルは EnemyCard の chip と一致させる。
ダメージ量の変動やカードオーバーレイ（ActionCardOverlay）表示を含め、hoverイベントを親へ委譲しつつ必要時は自前でオーバーレイを操作する。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useActionCardOverlay } from '@/composables/actionCardOverlay'
import { useImageHub } from '@/composables/imageHub'
import { buildCardInfoFromBlueprint, type CardBlueprint, type CardId } from '@/domain/library/Library'
import type { CardInfo } from '@/types/battle'
import type { EnemyActionChipViewModel } from '@/types/enemyActionChip'
import { useDescriptionOverlay } from '@/composables/descriptionOverlay'

const props = defineProps<{
  action: EnemyActionChipViewModel
}>()

const SINGLE_ATTACK_ICON_SRC = '/assets/icons/single_attack.png'
const MULTI_ATTACK_ICON_SRC = '/assets/icons/multi_attack.png'

const emit = defineEmits<{
  (event: 'enter', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'move', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'leave', payload: { key: string }): void
}>()

const chip = computed<EnemyActionChipViewModel>(() => props.action)

const actionOverlay = useActionCardOverlay()
const imageHub = useImageHub()
const { state: descriptionOverlay, show: showDescriptionOverlay, hide: hideDescriptionOverlay, updatePosition: updateDescriptionPosition } =
  useDescriptionOverlay()
let activeTooltip: { text: string; key: string } | null = null

const hoverCardInfo = computed<CardInfo | null>(() => {
  const source = chip.value.hoverCardSource
  if (!source?.show || !source.cardId) {
    return null
  }
  const blueprint = resolveBlueprintForHover(source.cardId, chip.value)
  if (!blueprint) {
    return null
  }
  return buildCardInfoFromBlueprint(blueprint, `enemy-action-${source.cardId}`) ?? null
})

function resolveBlueprintForHover(cardId: CardId, viewModel: EnemyActionChipViewModel): CardBlueprint | null {
  const damage = viewModel.damage
  const amount = damage?.amount
  const count = damage?.count
  if (amount === undefined || count === undefined) {
    return { type: cardId }
  }
  return {
    type: cardId,
    overrideAmount: amount,
    overrideCount: count,
  }
}

function resolveIconSrc(path?: string): string | undefined {
  if (!path) return undefined
  // ImageHub経由で正規化＋キャッシュ済みのImageを確保しておき、毎回生パスを直参照しない。
  imageHub.getElement(path)
  return imageHub.getSrc(path)
}

function showCardOverlay(event: MouseEvent): void {
  if (!hoverCardInfo.value) {
    return
  }
  hideEffectTooltip()
  actionOverlay.show(hoverCardInfo.value, { x: event.clientX, y: event.clientY })
}

function updateCardOverlayPosition(event: MouseEvent): void {
  if (!hoverCardInfo.value) {
    return
  }
  actionOverlay.updatePosition({ x: event.clientX, y: event.clientY })
}

function showEffectTooltip(event: MouseEvent, tooltip: string): void {
  // エフェクト系はカードオーバーレイではなく DescriptionOverlay で説明を出す。
  actionOverlay.hide()
  activeTooltip = { text: tooltip, key: chip.value.key }
  showDescriptionOverlay(tooltip, { x: event.clientX, y: event.clientY })
}

function updateEffectTooltipPosition(event: MouseEvent, tooltip?: string): void {
  if (
    !tooltip ||
    !descriptionOverlay.visible ||
    !activeTooltip ||
    activeTooltip.text !== tooltip ||
    activeTooltip.key !== chip.value.key
  ) {
    return
  }
  updateDescriptionPosition({ x: event.clientX, y: event.clientY })
}

function hideEffectTooltip(): void {
  if (!activeTooltip) {
    return
  }
  hideDescriptionOverlay()
  activeTooltip = null
}

function handleEnter(event: MouseEvent, tooltip?: string, allowOverlay = false): void {
  if (allowOverlay && hoverCardInfo.value && chip.value.hoverCardSource?.show) {
    showCardOverlay(event)
    return
  }
  if (tooltip) {
    showEffectTooltip(event, tooltip)
  } else {
    hideEffectTooltip()
  }
  emit('enter', { event, text: tooltip, key: chip.value.key })
}

function handleMove(event: MouseEvent, tooltip?: string, allowOverlay = false): void {
  if (allowOverlay && hoverCardInfo.value && chip.value.hoverCardSource?.show) {
    updateCardOverlayPosition(event)
    return
  }
  if (tooltip) {
    updateEffectTooltipPosition(event, tooltip)
  }
  emit('move', { event, text: tooltip, key: chip.value.key })
}

function handleLeave(): void {
  actionOverlay.hide()
  hideEffectTooltip()
  emit('leave', { key: chip.value.key })
}

function handleEffectLeave(): void {
  hideEffectTooltip()
  emit('leave', { key: chip.value.key })
}
</script>

<template>
  <li
    class="enemy-card__chip"
    :class="{
      'enemy-card__chip--disabled': chip.acted,
      'enemy-card__chip--skip': chip.category === 'skip',
    }"
    @mouseleave="handleLeave"
  >
    <div class="chip-header">
      <span
        class="chip-title"
        @mouseenter="(event) => handleEnter(event, undefined, Boolean(chip.hoverCardSource?.show))"
        @mousemove="(event) => handleMove(event, undefined, Boolean(chip.hoverCardSource?.show))"
      >
        {{ chip.title }}
      </span>
      <span v-if="chip.category === 'skip'" class="chip-badge chip-badge--skip">行動不可</span>
      <!-- <span v-else-if="chip.acted" class="chip-badge chip-badge--acted">Acted</span> -->
    </div>

    <div
      v-if="chip.category === 'attack' && chip.damage"
      class="chip-damage"
      @mouseenter="(event) => handleEnter(event, undefined, Boolean(chip.hoverCardSource?.show))"
      @mousemove="(event) => handleMove(event, undefined, Boolean(chip.hoverCardSource?.show))"
    >
      <v-icon class="attack-icon" size="16">
        <img
          :src="chip.damage.icon === 'multi' ? MULTI_ATTACK_ICON_SRC : SINGLE_ATTACK_ICON_SRC"
          :alt="chip.damage.icon === 'multi' ? '連続攻撃' : '一回攻撃'"
        />
      </v-icon>
      <span
        class="damage-amount"
        :class="{
          'value--boosted': chip.damage.amountChange === 'up',
          'value--reduced': chip.damage.amountChange === 'down',
          'value--changed': chip.damage.amountChange !== undefined,
        }"
      >
        {{ chip.damage.amount }}
      </span>
      <span v-if="chip.damage.icon === 'multi'" class="damage-count">
        ×
        <span
          :class="{
            'value--boosted': chip.damage.countChange === 'up',
            'value--reduced': chip.damage.countChange === 'down',
            'value--changed': chip.damage.countChange !== undefined,
          }"
        >
          {{ chip.damage.count }}
        </span>
      </span>
    </div>

    <div class="chip-body">

      <div v-if="chip.effects.length" class="chip-effects">
        <span
          v-for="(effect, index) in chip.effects"
          :key="index"
          class="effect"
          @mouseenter="(event) => handleEnter(event, effect.tooltip)"
          @mousemove="(event) => handleMove(event, effect.tooltip)"
          @mouseleave="handleEffectLeave"
        >
          <template v-if="effect.iconPath">
            <v-icon class="effect-icon" size="14">
              <img :src="resolveIconSrc(effect.iconPath)" alt="効果" />
            </v-icon>
          </template>
          <span class="effect-label">{{ effect.label }}</span>
          <span v-if="effect.targetName" class="effect-target">→ {{ effect.targetName }}</span>
        </span>
      </div>

      <div v-if="chip.targetName && !chip.effects.some((effect) => effect.targetName === chip.targetName)" class="chip-target">
        → {{ chip.targetName }}
      </div>
    </div>
  </li>
</template>

<style scoped>

.enemy-card__chip {
  display: inline-flex;
  align-items: center;
  flex-direction: column;
  padding: 8px 10px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.08);
  font-size: 13px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.88);
  position: relative;
  transition: opacity 0.5s ease, filter 0.5s ease;
  max-width: 260px;
  flex-wrap: nowrap;
}

.enemy-card__chip--disabled {
  opacity: 0.45;
  filter: grayscale(0.5);
}

.enemy-card__chip--skip {
  background: rgba(255, 120, 120, 0.12);
}

.chip-header {
  display: flex;
  align-items: center;
  line-height: 1;
  margin-bottom: 8px;
}

.chip-title {
  font-weight: 700;
  cursor: default;
}

.chip-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.chip-damage {
  display: inline-flex;
  align-items: center;
  /* gap: 6px; */
  cursor: default;
  /* margin-bottom: 4px; */
  padding-right: 4px;
}

.attack-icon {
  display: inline-flex;
}

.attack-icon img {
  width: 16px;
  height: 16px;
}

.damage-amount,
.damage-count {
  font-weight: 700;
}

.chip-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: center;
}

.effect {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.effect-icon {
  display: inline-flex;
}

.effect-icon img {
  width: 14px;
  height: 14px;
}

.effect-label {
  display: inline-flex;
}

.effect-target,
.chip-target {
  opacity: 0.8;
}

.chip-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
}

.chip-badge--skip {
  background: rgba(255, 120, 120, 0.2);
  color: #ffc2c2;
}

.chip-badge--acted {
  background: rgba(255, 255, 255, 0.12);
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
