<!--
Componentの責務: 山札/捨て札の一覧をオーバーレイ表示し、カード内容をスクロール可能なCardListで見せる。閉じる操作も提供する。
責務ではないこと: 山札/捨て札の内容を計算すること、表示トリガーの管理（どこから開くか）は親側で行う。
主な通信相手: 親(BattleViewなど)。propsで表示対象(activePile)とカードリスト(deckCards/discardCards)を受け取り、closeイベントで閉じ要求を返す。CardListへはCardInfoをそのまま渡す。
-->
<script setup lang="ts">
import { computed } from 'vue'
import CardList from '@/components/CardList.vue'
import type { CardInfo } from '@/types/battle'

const props = defineProps<{
  activePile: 'deck' | 'discard' | null
  deckCards: CardInfo[]
  discardCards: CardInfo[]
}>()

const emit = defineEmits<{
  (event: 'close'): void
}>()

const visible = computed(() => props.activePile !== null)
const title = computed(() => (props.activePile === 'discard' ? '捨て札' : '山札'))
const cards = computed(() =>
  props.activePile === 'discard' ? props.discardCards : props.deckCards,
)
</script>

<template>
  <transition name="pile-overlay">
    <div
      v-if="visible"
      class="pile-overlay"
      @contextmenu.prevent="emit('close')"
    >
      <!-- 右クリックでも閉じられるように、コンテキストメニューを抑止してcloseを発火 -->
      <div class="pile-window">
        <div class="pile-window__header">
          <div class="pile-window__title">
            {{ title }}（{{ cards.length }}枚）
          </div>
          <button type="button" class="pile-window__close" aria-label="閉じる" @click="emit('close')">
            ×
          </button>
        </div>
        <div class="pile-window__body">
          <CardList
            :cards="cards"
            :gap="20"
            :selectable="false"
            :force-playable="true"
            class="pile-card-list"
          />
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.pile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 6, 12, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
  backdrop-filter: blur(3px);
}

.pile-window {
  width: min(960px, 94vw);
  max-height: 80vh;
  background: linear-gradient(180deg, rgba(30, 26, 40, 0.96), rgba(16, 14, 20, 0.94));
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pile-window__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #f2eef8;
  letter-spacing: 0.08em;
  font-size: 15px;
}

.pile-window__title {
  font-weight: 700;
}

.pile-window__close {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fefefe;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.pile-window__close:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.4);
}

.pile-window__body {
  padding: 12px 14px 14px;
  overflow: hidden;
}

.pile-card-list :deep(.card-list__body) {
  max-height: 64vh;
}

.pile-card-list :deep(.card-list__grid) {
  justify-content: flex-start;
}

.pile-overlay-enter-active,
.pile-overlay-leave-active {
  transition: opacity 180ms ease;
}

.pile-overlay-enter-from,
.pile-overlay-leave-to {
  opacity: 0;
}
</style>
