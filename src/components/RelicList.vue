<!--
RelicList の責務:
- レリックの表示名・アイコン・説明・発動中フラグを一覧表示する。
- Hover 時の説明表示など上位のハンドラへイベントを委譲する。

責務ではないこと:
- 発動判定やレリックの状態管理。active フラグは props で受け取るのみ。
-->
<script setup lang="ts">
import type { RelicDisplayEntry } from '@/view/relicDisplayMapper'

const props = defineProps<{
  relics: RelicDisplayEntry[]
}>()

const emit = defineEmits<{
  (event: 'hover', relic: RelicDisplayEntry, e: MouseEvent | FocusEvent): void
  (event: 'leave'): void
}>()

function handleHover(relic: RelicDisplayEntry, e: MouseEvent | FocusEvent): void {
  emit('hover', relic, e)
}

function handleLeave(): void {
  emit('leave')
}
</script>

<template>
  <div class="relic-list">
    <button
      v-for="relic in props.relics"
      :key="relic.id"
      type="button"
      class="relic-icon"
      :class="{
        'relic-icon--active': relic.usageType === 'active',
        'relic-icon--passive': relic.usageType !== 'active',
        'relic-icon--enabled': relic.active,
      }"
      :aria-label="relic.name"
      :aria-disabled="relic.usageType !== 'active' ? 'true' : undefined"
      @mouseenter="(event) => handleHover(relic, event)"
      @focusin="(event) => handleHover(relic, event)"
      @mouseleave="handleLeave"
      @focusout="handleLeave"
    >
      <span class="relic-icon__glyph">{{ relic.icon }}</span>
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

.relic-icon--enabled {
  border-color: rgba(255, 255, 255, 0.5);
}

.relic-icon:not(.relic-icon--enabled) {
  filter: grayscale(0.7);
  opacity: 0.6;
}
</style>
