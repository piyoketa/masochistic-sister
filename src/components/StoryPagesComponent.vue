<!--
StoryPagesComponent の責務:
- ストーリー用の「1ページ分」のテキストや画像を表示し、次へ進むボタンを提供する。
- 呼び出し元は pages 配列を渡し、内部で現在ページを持ちながらページ送りを管理する。

責務ではないこと:
- ストーリー内容やルーティングの決定。ページ終了後の遷移先は親からハンドラで受け取る。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'

export interface StoryPage {
  title?: string
  lines: string[]
  imageSrc?: string
  actionLabel?: string
}

const props = defineProps<{
  pages: StoryPage[]
}>()

const emit = defineEmits<{
  (event: 'finish'): void
}>()

const currentIndex = ref(0)
const currentPage = computed(() => props.pages[currentIndex.value])
const isLast = computed(() => currentIndex.value >= props.pages.length - 1)

function handleNext(): void {
  if (!isLast.value) {
    currentIndex.value += 1
    return
  }
  emit('finish')
}
</script>

<template>
  <div class="story-page">
    <header v-if="currentPage?.title" class="story-header">
      <h1>{{ currentPage.title }}</h1>
    </header>
    <div v-if="currentPage?.imageSrc" class="story-hero">
      <img :src="currentPage.imageSrc" alt="" />
    </div>
    <div class="story-text">
      <p v-for="(line, idx) in currentPage?.lines ?? []" :key="idx">{{ line }}</p>
    </div>
    <div class="story-actions">
      <button type="button" class="story-button" @click="handleNext">
        {{ currentPage?.actionLabel ?? (isLast ? '進む' : '次へ') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.story-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
}

.story-header h1 {
  margin: 0;
  letter-spacing: 0.1em;
  color: #f5f2ff;
}

.story-hero img {
  max-width: 100%;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.story-text {
  background: rgba(15, 13, 22, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px 16px;
  line-height: 1.6;
  color: #e9e4f5;
}

.story-text p {
  margin: 0 0 8px;
}

.story-text p:last-child {
  margin-bottom: 0;
}

.story-actions {
  display: flex;
  justify-content: flex-end;
}

.story-button {
  background: rgba(255, 227, 115, 0.95);
  color: #2d1a0f;
  border: none;
  border-radius: 12px;
  padding: 10px 18px;
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.35);
}

.story-button:hover,
.story-button:focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.45);
}
</style>
