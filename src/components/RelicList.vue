<!--
RelicList の責務:
- レリックの表示名・アイコン・説明・発動中フラグを一覧表示する。
- Hover 時の説明表示など上位のハンドラへイベントを委譲する。

責務ではないこと:
- 発動判定やレリックの状態管理。active フラグは props で受け取るのみ。
-->
<script setup lang="ts">
import type { RelicDisplayEntry, RelicUiState } from '@/view/relicDisplayMapper'

const props = withDefaults(
  defineProps<{
    relics: RelicDisplayEntry[]
    /** バトル中のみ縁の光沢を付けたいので、フィールド等では false を渡す */
    enableGlow?: boolean
  }>(),
  {
    enableGlow: true,
  },
)

const emit = defineEmits<{
  (event: 'hover', relic: RelicDisplayEntry, e: MouseEvent | FocusEvent): void
  (event: 'leave'): void
  (event: 'click', relic: RelicDisplayEntry): void
}>()

function handleHover(relic: RelicDisplayEntry, e: MouseEvent | FocusEvent): void {
  emit('hover', relic, e)
}

function handleLeave(): void {
  emit('leave')
}

function handleClick(relic: RelicDisplayEntry): void {
  emit('click', relic)
}

function formatUsesRemaining(uses?: number | null): string | undefined {
  if (uses === undefined) return undefined
  if (uses === null) return '∞'
  return `${uses}`
}

function resolveUiState(relic: RelicDisplayEntry): RelicUiState {
  if (relic.uiState) return relic.uiState
  if (relic.usageType === 'field') return 'field-disabled'
  if (relic.usageType === 'passive') return relic.active ? 'passive-active' : 'passive-inactive'
  if (relic.usageType === 'active') {
    if (relic.usable) return 'active-ready'
    return 'disabled'
  }
  return 'disabled'
}

function isEnabledState(state: RelicUiState): boolean {
  return (
    state === 'passive-inactive' ||
    state === 'passive-active' ||
    state === 'active-ready' ||
    state === 'active-processing'
  )
}

function isGlowState(state: RelicUiState): boolean {
  return state === 'passive-active'
}

function isDisabledState(state: RelicUiState): boolean {
  return state === 'disabled' || state === 'field-disabled'
}

function isButtonDisabled(relic: RelicDisplayEntry): boolean {
  const state = resolveUiState(relic)
  if (relic.usageType !== 'active') return true
  return state !== 'active-ready'
}

function buildClass(relic: RelicDisplayEntry) {
  const state = resolveUiState(relic)
  return {
    'relic-icon--active': relic.usageType === 'active',
    'relic-icon--passive': relic.usageType === 'passive',
    'relic-icon--field': relic.usageType === 'field' || state === 'field-disabled',
    'relic-icon--ready': state === 'active-ready',
    'relic-icon--enabled': isEnabledState(state),
    // パッシブの発動中は必ず縁光沢を付与する（uiStateが欠落しても active フラグをフォールバック利用）
    'relic-icon--glow':
      (isGlowState(state) || (relic.usageType === 'passive' && relic.active)) && props.enableGlow !== false,
    'relic-icon--disabled': isDisabledState(state),
    'relic-icon--processing': state === 'active-processing',
  }
}
</script>

<template>
  <div class="relic-list">
    <button
      v-for="relic in props.relics"
      :key="relic.id"
      type="button"
      class="relic-icon"
      :class="buildClass(relic)"
      :data-ui-state="resolveUiState(relic)"
      :data-active="relic.active"
      :aria-label="relic.name"
      :aria-disabled="isButtonDisabled(relic) ? 'true' : undefined"
      :disabled="isButtonDisabled(relic)"
      @mouseenter="(event) => handleHover(relic, event)"
      @focusin="(event) => handleHover(relic, event)"
      @mouseleave="handleLeave"
      @focusout="handleLeave"
      @click="() => handleClick(relic)"
    >
      <span class="relic-icon__glyph">{{ relic.icon }}</span>
      <span v-if="relic.usageType === 'active' && formatUsesRemaining(relic.usesRemaining)" class="relic-icon__uses">
        {{ formatUsesRemaining(relic.usesRemaining) }}
      </span>
    </button>
  </div>
</template>

<style scoped>
.relic-list {
  display: flex;
  gap: 6px;
  align-items: center;
}

.relic-icon {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
  position: relative;
  overflow: visible;
}

.relic-icon__glyph {
  font-size: 14px;
}

.relic-icon--active {
  box-shadow: 0 0 10px rgba(255, 215, 128, 0.55);
}

.relic-icon--passive {
  opacity: 0.9;
}

.relic-icon--field {
  opacity: 0.9;
  border-style: dashed;
}

.relic-icon--enabled {
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 8px rgba(255, 236, 170, 0.6);
}

.relic-icon--processing {
  background: linear-gradient(180deg, rgba(255, 130, 130, 0.18), rgba(255, 82, 82, 0.08)),
    rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 142, 142, 0.9);
  box-shadow:
    0 0 10px rgba(255, 132, 132, 0.55),
    0 0 0 1px rgba(255, 132, 132, 0.35);
}

.relic-icon--processing .relic-icon__glyph {
  color: #ffe7e7;
}

.relic-icon--ready:hover {
  border-color: rgba(255, 142, 142, 0.9);
  box-shadow:
    0 0 10px rgba(255, 132, 132, 0.55),
    0 0 0 1px rgba(255, 132, 132, 0.35);
  background: linear-gradient(180deg, rgba(255, 130, 130, 0.12), rgba(255, 82, 82, 0.06)),
    rgba(255, 255, 255, 0.04);
}

.relic-icon--ready:focus-visible {
  animation: relic-focus-pop 0.24s ease;
}

.relic-icon--enabled:hover {
  transform: scale(1.06);
}

@keyframes relic-focus-pop {
  0% {
    transform: scale(1);
  }
  40% {
    transform: scale(1.12);
  }
  100% {
    transform: scale(1);
  }
}

/* BattleView の発動中レリックに、card-glow 相当の縁光沢を付与 */
.relic-icon--glow::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 10px;
  background:
    linear-gradient(#120e1c, #120e1c),
    conic-gradient(
      from var(--gradient-angle, 0turn),
      #5c4827 0%,
      #c7a03c 32%,
      #f9de90 36%,
      #c7a03c 40%,
      #5c4827 60%,
      #c7a03c 82%,
      #f9de90 86%,
      #c7a03c 90%,
      #5c4827 100%
    );
  background-origin: border-box;
  background-clip: content-box, border-box;
  padding: 2px;
  animation: relic-glow-rotate 2s linear infinite;
  z-index: -1;
}

@property --gradient-angle {
  syntax: '<angle>';
  initial-value: 0turn;
  inherits: false;
}

@keyframes relic-glow-rotate {
  to {
    --gradient-angle: 1turn;
  }
}

.relic-icon:not(.relic-icon--enabled) {
  filter: grayscale(0.7);
  opacity: 0.6;
}

.relic-icon--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.relic-icon__uses {
  position: absolute;
  bottom: -8px;
  right: -6px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: #ffd680;
  padding: 2px 4px;
  border-radius: 6px;
  line-height: 1;
  border: 1px solid rgba(255, 255, 255, 0.25);
}
</style>
