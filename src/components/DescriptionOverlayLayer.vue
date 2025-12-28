<script setup lang="ts">
import { computed } from 'vue'
import { useDescriptionOverlay } from '@/composables/descriptionOverlay'
import { renderRichText } from '@/utils/richText'

const { state } = useDescriptionOverlay()

const renderHtml = (text: string): string => renderRichText(text)

const overlayStyle = computed(() => ({
  left: `${(state.x ?? 0) + 12}px`,
  top: `${(state.y ?? 0) + 12}px`,
}))
</script>

<template>
  <teleport to="body">
    <div
      v-if="state.visible"
      class="description-overlay"
      :style="overlayStyle"
      v-html="renderHtml(state.text)"
    >
    </div>
  </teleport>
</template>

<style>
.description-overlay {
  position: fixed;
  min-width: 160px;
  max-width: 280px;
  padding: 10px 14px;
  border-radius: 12px;
  background: rgba(8, 10, 22, 0.95);
  color: rgba(255, 255, 255, 0.92);
  font-size: 13px;
  line-height: 1.4;
  letter-spacing: 0.04em;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  transform: translate(0, 0);
  z-index: 1500;
  backdrop-filter: blur(6px);
  white-space: pre-line;
}

.text-magnitude {
  color: #31d39e;
  font-weight: 700;
}

.text-variable {
  color: #31d39e;
  font-weight: 700;
}
</style>
