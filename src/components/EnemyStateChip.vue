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
    icon?: string
  }
}>()

const emit = defineEmits<{
  (event: 'enter', ev: MouseEvent): void
  (event: 'move', ev: MouseEvent): void
  (event: 'leave'): void
}>()

// Vuetifyのデフォルトアイコンセットで解決できるよう、mdi-プレフィックスの有無を吸収する。
const resolveIconName = (icon?: string): string | undefined => {
  if (!icon) {
    return undefined
  }
  return icon.startsWith('mdi-') ? icon : `mdi-${icon}`
}
</script>

<template>
  <li
    class="enemy-card__chip"
    :class="['enemy-card__chip--plain', { 'enemy-card__chip--important': props.chip.isImportant }]"
    @mouseenter="(ev) => emit('enter', ev)"
    @mousemove="(ev) => emit('move', ev)"
    @mouseleave="() => emit('leave')"
  >
    <v-icon
      v-if="props.chip.icon"
      class="enemy-card__chip-icon"
      size="16"
      :icon="resolveIconName(props.chip.icon)"
    />
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

.enemy-card__chip-icon {
  color: #cbd6ff;
}
</style>
