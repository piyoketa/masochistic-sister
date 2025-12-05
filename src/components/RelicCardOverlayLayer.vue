<!--
Componentの責務: マウス付近にレリック情報カードを表示するレイヤー。useRelicCardOverlayの状態を描画するだけで、トリガーは他コンポーネントに委譲する。
責務ではないこと: レリック情報の取得やポジション計算（composable側で実施）。
主な通信相手: useRelicCardOverlay（状態管理）。
-->
<script setup lang="ts">
import { computed } from 'vue'
import { useRelicCardOverlay } from '@/composables/relicCardOverlay'
import { getRelicInfoByClassName } from '@/domain/library/Library'

const { state } = useRelicCardOverlay()

const overlayStyle = computed(() => ({
  left: `${(state.x ?? 0) + 12}px`,
  top: `${(state.y ?? 0) + 12}px`,
}))

const overlayRelic = computed(() => {
  if (state.relic) return state.relic
  if (state.relicClassName) return getRelicInfoByClassName(state.relicClassName)
  return null
})
</script>

<template>
  <teleport to="body">
    <div v-if="state.visible && overlayRelic" class="relic-card-overlay" :style="overlayStyle">
      <div class="relic-card">
        <div class="relic-card__title-row">
          <span class="relic-card__icon">{{ overlayRelic.icon }}</span>
          <span class="relic-card__title">{{ overlayRelic.name }}</span>
        </div>
        <div class="relic-card__body">{{ overlayRelic.description }}</div>
      </div>
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

.relic-card {
  background: radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.16), transparent 40%),
    linear-gradient(180deg, rgba(18, 16, 28, 0.94), rgba(10, 10, 18, 0.94));
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 14px;
  padding: 12px;
  color: #f4f1ff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
}

.relic-card__title-row {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.relic-card__icon {
  font-size: 20px; /* RelicListヘッダーのアイコンサイズに合わせる */
  line-height: 1;
}

.relic-card__title {
  font-weight: 800;
  letter-spacing: 0.08em;
}

.relic-card__body {
  font-size: 13px;
  line-height: 1.5;
}
</style>
