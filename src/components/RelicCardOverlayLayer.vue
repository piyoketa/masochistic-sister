<!--
Componentの責務: マウス付近にレリック情報カードを表示するレイヤー。useRelicCardOverlayの状態を描画するだけで、トリガーは他コンポーネントに委譲する。
責務ではないこと: レリック情報の取得やポジション計算（composable側で実施）。
主な通信相手: useRelicCardOverlay（状態管理）。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useRelicCardOverlay } from '@/composables/relicCardOverlay'
import { getRelicInfoById } from '@/domain/library/Library'
import RelicCard from '@/components/RelicCard.vue'

const { state } = useRelicCardOverlay()

const overlayStyle = computed(() => ({
  left: `${(state.x ?? 0) + 12}px`,
  top: `${(state.y ?? 0) + 12}px`,
}))

const overlayRelic = computed(() => {
  if (state.relic) return state.relic
  if (state.relicId) return getRelicInfoById(state.relicId)
  return null
})
</script>

<template>
  <teleport to="body">
    <div v-if="state.visible && overlayRelic" class="relic-card-overlay" :style="overlayStyle">
      <RelicCard :icon="overlayRelic.icon" :name="overlayRelic.name" :description="overlayRelic.description" />
    </div>
  </teleport>
</template>

<style scoped>
.relic-card-overlay {
  position: fixed;
  z-index: 1600;
  pointer-events: none;
  width: 280px;
}

</style>
