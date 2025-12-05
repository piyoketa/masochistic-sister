<!--
Componentの責務: マウス付近にActionCardをオーバーレイ表示するレイヤー。useActionCardOverlayの状態を描画するだけで、トリガーは他コンポーネントに委譲する。
責務ではないこと: カード情報の計算や表示位置の判定ロジックの保持（composable側で決定）。
主な通信相手: useActionCardOverlay（状態管理）。外部からはshow/hideで操作される。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useActionCardOverlay } from '@/composables/actionCardOverlay'
import ActionCard from '@/components/ActionCard.vue'
import type { CardInfo } from '@/types/battle'
import { buildCardInfoFromBlueprint, createCardFromBlueprint } from '@/domain/library/Library'

const { state } = useActionCardOverlay()

const overlayStyle = computed(() => ({
  left: `${(state.x ?? 0) + 12}px`,
  top: `${(state.y ?? 0) + 12}px`,
}))

const cardProps = computed(() => {
  if (state.card) {
    const card = state.card
    const fallback: CardInfo = {
      id: card.id ?? 'overlay-card',
      title: card.title ?? 'カード',
      type: card.type ?? 'skill',
      cost: card.cost ?? 0,
    }
    return { ...fallback, ...card }
  }
  if (state.blueprint) {
    return buildCardInfoFromBlueprint(state.blueprint, 'overlay') ?? null
  }
  return null
})
</script>

<template>
  <teleport to="body">
    <div v-if="state.visible && cardProps" class="action-card-overlay" :style="overlayStyle">
      <ActionCard
        :key="cardProps.id"
        v-bind="cardProps"
        :disabled="false"
        :affordable="true"
        variant="frame"
      />
    </div>
  </teleport>
</template>

<style scoped>
.action-card-overlay {
  position: fixed;
  z-index: 1600;
  pointer-events: none;
  --action-card-width: 120px;
  --action-card-height: 170px;
}

@media (max-width: 640px) {
  .action-card-overlay {
    --action-card-width: 110px;
    --action-card-height: 160px;
  }
}
</style>
