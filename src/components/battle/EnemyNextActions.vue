<script setup lang="ts">
import { computed } from 'vue'
import EnemyActionChip from '@/components/EnemyActionChip.vue'
import type { EnemyActionChipViewModel } from '@/types/enemyActionChip'
import { formatEnemyActionChipsForView } from '@/view/enemyActionHintsForView'

const props = defineProps<{
  enemyId: number
  actions: import('@/view/enemyActionHintsForView').EssentialEnemyActionHint[]
  highlighted?: boolean
}>()

const emit = defineEmits<{
  (event: 'tooltip-enter', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'tooltip-move', payload: { event: MouseEvent; text?: string; key: string }): void
  (event: 'tooltip-leave', payload: { key: string }): void
}>()

const formattedActions = computed<EnemyActionChipViewModel[]>(() =>
  props.actions.length > 0
    ? props.actions
        .map((essential) => formatEnemyActionChipsForView(props.enemyId, [essential])[0])
        .filter((vm): vm is EnemyActionChipViewModel => Boolean(vm))
    : [],
)
</script>

<template>
  <section
    v-if="formattedActions.length"
    class="enemy-next-actions"
    :class="{ 'enemy-next-actions--highlighted': highlighted }"
  >
    <ul
      class="enemy-next-actions__list"
      :class="{ 'enemy-next-actions__list--highlight': highlighted }"
    >
      <EnemyActionChip
        v-for="action in formattedActions"
        :key="action.key"
        :action="action"
        @enter="(payload) => emit('tooltip-enter', payload)"
        @move="(payload) => emit('tooltip-move', payload)"
        @leave="(payload) => emit('tooltip-leave', payload)"
      />
    </ul>
  </section>
</template>

<style scoped>
.enemy-next-actions {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  height: 80px;
  align-items: center;
  justify-content: center;
  padding: 2px 4px; /* 以前のラップ要素のパディングを移動し、表示位置を変えずに重ねる */
  z-index: 2; /* 敵カードより前面で操作可能にする */
  transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
}

.enemy-card__chip {
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
}

.enemy-next-actions--highlighted .enemy-card__chip {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 0 0 2px rgba(255, 235, 160, 0.45), 0 8px 18px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 235, 160, 0.7);
  border-radius: 12px;
  background: radial-gradient(circle at 20% 30%, rgba(255, 235, 160, 0.16), transparent 45%),
    rgba(255, 255, 200, 0.08);
}
</style>
