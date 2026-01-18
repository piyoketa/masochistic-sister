<!--
Componentの責務: プレイヤーのデッキ一覧を全画面オーバーレイで表示し、閉じるUIを提供する。
責務ではないこと: デッキ内容の生成・更新・ソート規則の決定。表示するカード配列は store から受け取る。
主な通信相手: usePlayerDeckOverlayStore。`open(cards: CardInfo[])` で表示対象を受け取り、`close()` で閉じる。
やり取りする情報: CardInfo（UI表示用のカード情報。タイトル/コスト/説明などを含む）。
類似型との差異: CardBlueprint はデッキ定義のみで表示情報を持たないため、このコンポーネントでは扱わない。
-->
<script setup lang="ts">
import { computed } from 'vue'
import CardList from '@/components/CardList.vue'
import { usePlayerDeckOverlayStore } from '@/stores/playerDeckOverlayStore'

const overlayStore = usePlayerDeckOverlayStore()

const visible = computed(() => overlayStore.visible)
const cardCount = computed(() => overlayStore.cards.length)

function closeOverlay(): void {
  overlayStore.close()
}
</script>

<template>
  <transition name="player-deck-overlay">
    <div
      v-if="visible"
      class="player-deck-overlay"
      @contextmenu.prevent="closeOverlay"
    >
      <!-- 右クリックでも閉じられるようにし、誤操作時の離脱を確保する -->
      <div class="player-deck-window">
        <div class="player-deck-window__header">
          <div class="player-deck-window__title">
            デッキ一覧（{{ cardCount }}枚）
          </div>
          <button
            type="button"
            class="player-deck-window__close"
            aria-label="閉じる"
            @click="closeOverlay"
          >
            ×
          </button>
        </div>
        <div class="player-deck-window__body">
          <CardList
            :cards="overlayStore.cards"
            :gap="20"
            :selectable="false"
            :force-playable="true"
            class="player-deck-card-list"
          />
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.player-deck-overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 6, 12, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  backdrop-filter: blur(3px);
}

.player-deck-window {
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

.player-deck-window__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: #f2eef8;
  letter-spacing: 0.08em;
  font-size: 15px;
}

.player-deck-window__title {
  font-weight: 700;
}

.player-deck-window__close {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fefefe;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}

.player-deck-window__close:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.4);
}

.player-deck-window__body {
  padding: 12px 14px 14px;
  overflow: hidden;
}

.player-deck-card-list :deep(.card-list__body) {
  max-height: 64vh;
}

.player-deck-card-list :deep(.card-list__grid) {
  justify-content: flex-start;
}

.player-deck-overlay-enter-active,
.player-deck-overlay-leave-active {
  transition: opacity 180ms ease;
}

.player-deck-overlay-enter-from,
.player-deck-overlay-leave-to {
  opacity: 0;
}
</style>
