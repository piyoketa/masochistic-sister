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

const overlayContent = computed(() => {
  if (!state.emphasizeFirstLine) {
    return { emphasize: false as const, title: '', body: state.text }
  }
  // 先頭行をタイトルとして扱い、残りを本文にまとめる
  const [title, ...rest] = state.text.split('\n')
  return { emphasize: true as const, title: title ?? '', body: rest.join('\n') }
})
</script>

<template>
  <teleport to="body">
    <div
      v-if="state.visible"
      class="description-overlay"
      :style="overlayStyle"
    >
      <template v-if="overlayContent.emphasize">
        <div class="description-overlay__title" v-html="renderHtml(overlayContent.title)"></div>
        <div class="description-overlay__body" v-html="renderHtml(overlayContent.body)"></div>
      </template>
      <template v-else>
        <div class="description-overlay__body" v-html="renderHtml(overlayContent.body)"></div>
      </template>
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

.description-overlay__title {
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.08em;
  color: #ffd680;
  margin-bottom: 6px;
}

.description-overlay__body {
  margin: 0;
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
