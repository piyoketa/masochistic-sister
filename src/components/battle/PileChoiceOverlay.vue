<!--
Componentの責務:
- 山札や捨て札などの手札外カードを選択するオーバーレイを表示し、候補カードから1枚をクリックで選択させる。
- 表示メッセージとキャンセル操作を提供し、選択結果を親へ通知する。

責務ではないこと:
- 候補カードのフィルタリングや選択理由の表示。親から渡された候補のみを表示する前提とし、非選択理由は扱わない。
- カードの移動やアニメーション。選択結果の適用は親側が担う。

主な通信相手:
- 親コンポーネント（BattleView など）: props で候補カード配列とメッセージを受け取り、select/cancel イベントを emit する。
- CardList: カード表示を担い、クリックで選択通知する。
-->
<script setup lang="ts">
import CardList from '@/components/CardList.vue'
import type { CardInfo } from '@/types/battle'

const props = defineProps<{
  visible: boolean
  title?: string
  message?: string
  candidates: CardInfo[]
}>()

const emit = defineEmits<{
  (event: 'select', cardId: number): void
  (event: 'cancel'): void
}>()

function handleSelect(card: CardInfo): void {
  const numericId = typeof card.id === 'number' ? card.id : Number(card.id)
  if (Number.isInteger(numericId)) {
    emit('select', numericId)
  }
}

function handleCancel(): void {
  emit('cancel')
}
</script>

<template>
<div v-if="visible" class="pile-choice-overlay" @contextmenu.prevent="handleCancel">
  <div class="pile-choice-overlay__window">
    <div class="pile-choice-overlay__header">
      <div class="pile-choice-overlay__title">{{ title ?? 'カードを選択' }}</div>
      <button type="button" class="pile-choice-overlay__close" aria-label="閉じる" @click="handleCancel">×</button>
    </div>
    <div class="pile-choice-overlay__body">
      <p v-if="message" class="pile-choice-overlay__message">{{ message }}</p>
      <CardList
        :cards="candidates"
        :gap="16"
        :selectable="true"
        :force-playable="true"
        class="pile-choice-overlay__list"
        @card-click="handleSelect"
      />
    </div>
  </div>
</div>
</template>

<style scoped>
.pile-choice-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 6, 12, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50; /* PileOverlay より上 */
  backdrop-filter: blur(3px);
}

.pile-choice-overlay__window {
  width: min(960px, 94vw);
  max-height: 80vh;
  background: linear-gradient(180deg, rgba(38, 34, 48, 0.96), rgba(18, 16, 24, 0.94));
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pile-choice-overlay__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #f2eef8;
  letter-spacing: 0.08em;
  font-size: 15px;
}

.pile-choice-overlay__title {
  font-weight: 700;
}

.pile-choice-overlay__close {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fefefe;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.pile-choice-overlay__close:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.4);
}

.pile-choice-overlay__body {
  padding: 12px 14px 14px;
  overflow: hidden;
  color: #f1edf5;
}

.pile-choice-overlay__message {
  margin: 0 0 10px;
  font-size: 14px;
  color: #cfc7da;
}

.pile-choice-overlay__list :deep(.card-list__body) {
  max-height: 64vh;
}

.pile-choice-overlay__list :deep(.card-list__grid) {
  justify-content: flex-start;
}

</style>
