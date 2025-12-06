<!--
RandomCardRewardView の責務:
- フィールドのランダムカード獲得マスで、事前に決定された候補（例: スキル3枚）から1枚だけ選択させる。
- プレイヤー状態を表示しつつ、選択カードの獲得とフィールドへの復帰を1ボタンで行う。

非責務:
- 候補決定やフィールド遷移管理（フィールド生成は Field 側の責務）。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MainGameLayout from '@/components/battle/MainGameLayout.vue'
import CardList from '@/components/CardList.vue'
import { usePlayerStore, type DeckCardType } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import type { CardInfo } from '@/types/battle'
import { createCardFromBlueprint } from '@/domain/library/Library'
import { CardRepository } from '@/domain/repository/CardRepository'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const fieldStore = useFieldStore()
const router = useRouter()

const selectedActions = computed<DeckCardType[]>(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isRandomCardRewardNode(node)) {
    return node.selectedActions as DeckCardType[]
  }
  return []
})

const cardInfos = ref<CardInfo[]>([])
const selectedCardId = ref<string | null>(null)
const isProcessing = ref(false)
const claimError = ref<string | null>(null)

const playerStatus = computed(() => ({
  hp: playerStore.hp,
  maxHp: playerStore.maxHp,
  deckCount: playerStore.deck.length,
}))

const canClaim = computed(() => Boolean(selectedCardId.value) && !isProcessing.value)

onMounted(() => {
  const repo = new CardRepository()
  cardInfos.value = selectedActions.value
    .map((type, index) => {
      const card = createCardFromBlueprint({ type }, repo)
      return buildCardInfoFromCard(card, {
        id: `choice-${card.id ?? index}`,
        affordable: true,
        disabled: false,
      })
    })
    .filter((info): info is CardInfo => info !== null)
  // 初期状態では何も選択しない
  selectedCardId.value = null
})

function resolveDeckTypeById(id: string | null): DeckCardType | null {
  if (!id) return null
  const idx = cardInfos.value.findIndex((info) => info.id === id)
  if (idx < 0) return null
  return selectedActions.value[idx] ?? null
}

async function handleClaim(): Promise<void> {
  if (!canClaim.value) return
  isProcessing.value = true
  claimError.value = null
  try {
    const deckType = resolveDeckTypeById(selectedCardId.value)
    if (deckType) {
      playerStore.addCard(deckType)
    }
    fieldStore.markCurrentCleared()
    await router.push('/field')
  } catch (error) {
    claimError.value = error instanceof Error ? error.message : String(error)
    isProcessing.value = false
  }
}
</script>

<template>
  <MainGameLayout>
    <div class="card-reward-view">
      <header class="header">
        <h1>カード獲得（選択）</h1>
        <div class="header-status">
          <span>HP: {{ playerStatus.hp }} / {{ playerStatus.maxHp }}</span>
          <span>デッキ枚数: {{ playerStatus.deckCount }}</span>
        </div>
      </header>

      <section class="card-section">
        <CardList
          v-if="cardInfos.length"
          :cards="cardInfos"
          :gap="16"
          :height="260"
          :hover-effect="true"
          :force-playable="true"
          selectable
          :selected-card-id="selectedCardId"
          @update:selected-card-id="(id) => {
            selectedCardId = (id as string) ?? null
          }"
        />
        <p class="card-note">
          {{
            cardInfos.length
              ? '提示されたカードから１枚選んで獲得します。'
              : '獲得できるカードがありません。'
          }}
        </p>
      </section>

      <footer class="actions">
        <button type="button" class="action-button" :disabled="!canClaim" @click="handleClaim">
          獲得してフィールドに戻る
        </button>
        <p v-if="claimError" class="action-error">{{ claimError }}</p>
      </footer>
    </div>
  </MainGameLayout>
</template>

<style scoped>
.card-reward-view {
  padding: 24px clamp(20px, 5vw, 48px);
  color: #f5f2ff;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.header h1 {
  margin: 0;
  letter-spacing: 0.1em;
}

.header-status {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 13px;
  color: rgba(245, 242, 255, 0.85);
}

.card-section {
  background: rgba(16, 14, 24, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 12px 14px 16px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

.card-note {
  margin: 8px 4px 0;
  font-size: 12px;
  color: rgba(245, 242, 255, 0.72);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.action-button {
  background: rgba(255, 227, 115, 0.95);
  color: #2d1a0f;
  border: none;
  border-radius: 12px;
  padding: 10px 18px;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 0.06em;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.35);
}

.action-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.action-button:not(:disabled):hover,
.action-button:not(:disabled):focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.45);
}

.action-error {
  margin: 0;
  font-size: 12px;
  color: #ffb4c1;
}
</style>
