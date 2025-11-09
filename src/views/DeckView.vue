<script setup lang="ts">
import { computed } from 'vue'
import GameLayout from '@/components/GameLayout.vue'
import { usePlayerStore } from '@/stores/playerStore'

const playerStore = usePlayerStore()
playerStore.ensureInitialized()

const deckEntries = computed(() => playerStore.getDeckPreview())
</script>

<template>
  <GameLayout>
    <template #window>
      <section class="deck-view">
        <header class="deck-header">
          <h1>所持デッキ</h1>
          <p>戦闘開始時は、このデッキを複製して山札を編成します。</p>
        </header>
        <ul class="deck-list">
          <li v-for="card in deckEntries" :key="card.id" class="deck-card">
            <div class="deck-card__title">
              <span class="deck-card__label">{{ card.type }}</span>
              <strong>{{ card.title }}</strong>
            </div>
            <p class="deck-card__description">
              {{ card.description }}
            </p>
          </li>
        </ul>
      </section>
    </template>
  </GameLayout>
</template>

<style scoped>
.deck-view {
  padding: 24px;
  color: #f4f1ff;
}

.deck-header {
  margin-bottom: 20px;
}

.deck-header h1 {
  margin: 0 0 6px;
  font-size: 24px;
  letter-spacing: 0.1em;
}

.deck-header p {
  margin: 0;
  color: rgba(244, 241, 255, 0.75);
  font-size: 14px;
}

.deck-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.deck-card {
  padding: 16px;
  border-radius: 14px;
  background: rgba(15, 12, 24, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
}

.deck-card__title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.deck-card__label {
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.deck-card__description {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.4;
}
</style>
