<!--
CardList.vue の責務:
- 渡された `CardInfo` 配列を ActionCard でタイル状に描画し、可変高さ＋スクロール対応のギャラリーを提供する。
- 将来的なカード報酬選択（3枚提示など）に備え、hover/selection 状態を表現できる骨組み（クラス・イベント）を用意する。

責務ではないこと:
- カード使用やバトル進行などのドメイン操作。ここでは純粋に表示と軽いインタラクションのみを扱う。
- カードデータの取得やフィルタリング。必要な `CardInfo` の構築は親コンポーネント（例: Library）側に委譲する。

主な通信相手とインターフェース:
- ActionCard: 各カードの見た目を担当する子コンポーネント。`CardInfo` をそのまま `v-bind` で渡す。
- 親コンポーネント（例: ActionCardLabView）: `cards`/`selectedCardId` props と `card-hover` / `card-click` / `update:selectedCardId` emit で双方向に連携する。
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import ActionCard from '@/components/ActionCard.vue'
import type { CardInfo } from '@/types/battle'

const props = withDefaults(
  defineProps<{
    cards: CardInfo[]
    title?: string
    height?: number | string
    gap?: number
    selectable?: boolean
    hoverEffect?: boolean
    selectedCardId?: string | null
    noHeightLimit?: boolean
    forcePlayable?: boolean
  }>(),
  {
    cards: () => [] as CardInfo[],
    gap: 16,
    selectable: false,
    hoverEffect: true,
    selectedCardId: null,
    noHeightLimit: false,
    forcePlayable: false,
  },
)

const emit = defineEmits<{
  (event: 'card-hover', payload: CardInfo): void
  (event: 'card-leave', payload: CardInfo): void
  (event: 'card-click', payload: CardInfo): void
  (event: 'update:selectedCardId', value: string | null): void
}>()

const hoveredCardId = ref<string | null>(null)

const containerStyle = computed(() => {
  const style: Record<string, string> = {
    '--card-list-gap': `${props.gap}px`,
  }
  if (!props.noHeightLimit && props.height !== undefined && props.height !== null) {
    style['--card-list-max-height'] =
      typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  return style
})

const bodyClasses = computed(() => ({
  'card-list__body--no-limit': props.noHeightLimit,
}))

function itemClasses(card: CardInfo): Record<string, boolean> {
  return {
    'card-list__item--hoverable': props.hoverEffect,
    'card-list__item--hovered': hoveredCardId.value === card.id,
    'card-list__item--selectable': props.selectable,
    'card-list__item--selected':
      props.selectable && props.selectedCardId !== null && props.selectedCardId === card.id,
  }
}

function handleMouseEnter(card: CardInfo): void {
  if (!props.hoverEffect) {
    return
  }
  hoveredCardId.value = card.id
  emit('card-hover', card)
}

function handleMouseLeave(card: CardInfo): void {
  if (!props.hoverEffect) {
    return
  }
  hoveredCardId.value = hoveredCardId.value === card.id ? null : hoveredCardId.value
  emit('card-leave', card)
}

function handleClick(card: CardInfo): void {
  if (props.selectable) {
    const nextValue = props.selectedCardId === card.id ? null : card.id
    emit('update:selectedCardId', nextValue)
  }
  emit('card-click', card)
}

function playableCard(card: CardInfo): CardInfo {
  if (!props.forcePlayable) {
    return card
  }
  return {
    ...card,
    affordable: true,
    disabled: false,
  }
}
</script>

<template>
  <section class="card-list" :style="containerStyle">
    <header v-if="props.title" class="card-list__header">
      <h3>{{ props.title }}</h3>
      <span class="card-list__count">{{ props.cards.length }}枚</span>
    </header>
    <div class="card-list__body" :class="bodyClasses">
      <div class="card-list__grid">
        <div
          v-for="card in props.cards"
          :key="card.id"
          class="card-list__item"
          :class="itemClasses(card)"
          @mouseenter="handleMouseEnter(card)"
          @mouseleave="handleMouseLeave(card)"
          @click="handleClick(card)"
        >
          <ActionCard v-bind="playableCard(card)" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0;
  --card-list-gap: 16px;
  --card-list-max-height: 360px;
}

.card-list__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0 8px;
  color: #f5f1e7;
}

.card-list__header h3 {
  margin: 0;
  font-size: 16px;
  letter-spacing: 0.08em;
}

.card-list__count {
  font-size: 13px;
  color: rgba(245, 241, 231, 0.75);
}

.card-list__body {
  overflow-y: auto;
  max-height: var(--card-list-max-height, 360px);
  padding-right: 8px;
}

.card-list__body--no-limit {
  overflow: visible;
  overflow-x: visible;
  overflow-y: visible;
  max-height: none;
  padding-right: 0;
}

.card-list__grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--card-list-gap, 16px);
}

.card-list__item {
  width: 94px;
  flex: 0 0 auto;
  transition: transform 120ms ease, filter 120ms ease;
}

.card-list__item--hoverable.card-list__item--hovered {
  transform: translateY(-4px);
}

.card-list__item--selectable.card-list__item--selected {
  filter: drop-shadow(0 0 12px rgba(255, 208, 0, 0.45));
}

.card-list__item--selectable:not(.card-list__item--selected) {
  cursor: pointer;
}

.card-list__body::-webkit-scrollbar {
  width: 6px;
}

.card-list__body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
}

.card-list__body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 3px;
}
</style>
