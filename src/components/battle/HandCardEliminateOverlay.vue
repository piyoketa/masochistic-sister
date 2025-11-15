<!--
HandCardEliminateOverlay の責務:
- card-eliminate 演出中に、ActionCard の見た目を維持したオーバーレイを描画して砂化マスクを適用する。
- オーバーレイごとに absolute 位置とサイズを受け取り、アクティベーション後にマスクアニメーションを発火させる。

責務ではないこと:
- StageEvent の監視やカード配列の更新。これらは親コンポーネントと composable が担う。
-->
<script setup lang="ts">
import ActionCard from '@/components/ActionCard.vue'
import type { CardEliminateOverlay } from './composables/useCardEliminateOverlays'

const props = defineProps<{
  overlay: CardEliminateOverlay
}>()
</script>

<template>
  <div
    class="hand-eliminate-overlay"
    :style="props.overlay.style"
    :class="{ 'hand-eliminate-overlay--active': props.overlay.active }"
  >
    <ActionCard
      v-bind="props.overlay.info"
      :operations="props.overlay.operations"
      :affordable="props.overlay.affordable"
      :disabled="true"
    />
  </div>
</template>
