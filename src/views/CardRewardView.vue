<!--
CardRewardView の責務:
- カード獲得マスに入った際の報酬受け取り画面を表示する。
- 現在のプレイヤーHPを表示し、PlayerCardComponent に空の演出を渡して表示する。
- card-reward ノードの候補から抽選したカードリストを表示し、デッキに追加できるようにする。

非責務:
- バトル進行や Field の全体管理。進行状態は fieldStore に委譲する。

主なインターフェース:
- fieldStore: 現在ノード (card-reward) の candidateActions/drawCount を取得し、戻る際に markCurrentCleared する。
- playerStore: HP 表示とデッキ追加(addCard)に使用。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameLayout from '@/components/GameLayout.vue'
import PlayerCardComponent from '@/components/PlayerCardComponent.vue'
import CardList from '@/components/CardList.vue'
import type { CardInfo } from '@/types/battle'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import { buildCardInfoFromBlueprint, type CardBlueprint } from '@/domain/library/Library'

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const fieldStore = useFieldStore()
const router = useRouter()

const selectionTheme = ref<EnemySelectionTheme>('default')
const outcomes: [] = []
const states: string[] = []

const candidateBlueprints = computed<CardBlueprint[]>(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isCardRewardNode(node)) {
    return node.candidateActions as CardBlueprint[]
  }
  return []
})

const drawCount = computed(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isCardRewardNode(node)) {
    return node.drawCount
  }
  return 0
})

interface DrawnCardEntry {
  info: CardInfo
  blueprint: CardBlueprint
}

const drawnCards = ref<DrawnCardEntry[]>([])
const claimed = ref(false)
const drawnCardInfos = computed(() => drawnCards.value.map((entry) => entry.info))

const playerHp = computed(() => ({
  current: playerStore.hp,
  max: playerStore.maxHp,
}))

const canProceed = computed(() => Boolean(drawnCards.value.length))

onMounted(() => {
  drawnCards.value = drawCards(candidateBlueprints.value, drawCount.value)
})

function drawCards(blueprints: CardBlueprint[], count: number): DrawnCardEntry[] {
  if (count <= 0 || blueprints.length === 0) {
    return []
  }
  const results: DrawnCardEntry[] = []
  for (let i = 0; i < count; i += 1) {
    const randomBlueprint = blueprints[Math.floor(Math.random() * blueprints.length)] as CardBlueprint
    const info = buildCardInfoFromBlueprint(randomBlueprint, `${randomBlueprint.type}-${i}`)
    if (info) {
      results.push({ info, blueprint: randomBlueprint })
    }
  }
  return results
}

function handleClaim(): void {
  if (claimed.value) return
  for (const { blueprint } of drawnCards.value) {
    playerStore.addCard(blueprint)
  }
  claimed.value = true
}

async function handleProceed(): Promise<void> {
  fieldStore.markCurrentCleared()
  await router.push('/field')
}
</script>

<template>
<GameLayout>
  <template #window>
    <div class="card-reward-view">
      <header class="header">
        <h1>カード獲得</h1>
        <div class="header-status">
          <span>HP: {{ playerHp.current }} / {{ playerHp.max }}</span>
          <span>デッキ枚数: {{ playerStore.deck.length }}</span>
        </div>
      </header>

      <div class="layout">
        <aside class="player-area">
          <PlayerCardComponent
            :pre-hp="playerHp"
            :post-hp="playerHp"
            :outcomes="outcomes"
            :selection-theme="selectionTheme"
            :states="states"
            :state-snapshots="[]"
            :state-progress-count="playerStore.stateProgressCount"
            :show-hp-gauge="false"
          />
        </aside>
        <main class="main">
          <h2>獲得カード ({{ drawnCards.length }}枚)</h2>
          <CardList
            :cards="drawnCardInfos"
            :force-playable="true"
            :gap="50"
            :selectable="false"
            :hover-effect="!claimed"
          />
          <div class="actions">
            <button type="button" class="action-button" :disabled="!canProceed || claimed" @click="handleClaim">
              獲得
            </button>
            <button type="button" class="action-button action-button--next" :disabled="!canProceed" @click="handleProceed">
              次に進む
            </button>
          </div>
        </main>
      </div>
    </div>
  </template>
</GameLayout>
</template>

<style scoped>
.card-reward-view {
  padding: 24px clamp(20px, 5vw, 64px);
  background: radial-gradient(circle at top, rgba(34, 28, 63, 0.95), rgba(9, 9, 14, 0.95));
  color: #f5f2ff;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.header h1 {
  margin: 0;
  letter-spacing: 0.1em;
}

.header-status {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 14px;
  color: rgba(245, 242, 255, 0.85);
}

.player-area {
  width: 280px;
}

.main h2 {
  margin: 0 0 12px;
}

.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: flex-start;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.action-button {
  background: rgba(255, 227, 115, 0.9);
  color: #2d1a0f;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-weight: 800;
  cursor: pointer;
}

.action-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-button--next {
  background: linear-gradient(90deg, #78ffd6, #6e8bff);
  color: #0d0d1a;
}
</style>
