<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import CardList from '@/components/CardList.vue'
import type { CardInfo, CardTagInfo } from '@/types/battle'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const fieldStore = useFieldStore()
const router = useRouter()

const rewardsState = ref({
  hp: false,
  gold: false,
  card: false,
})

const newCards = ref<CardInfo[]>(buildMockNewCards())
const selectedCardId = ref<string | null>(null)

const playerStatus = computed(() => ({
  hp: playerStore.hp,
  maxHp: playerStore.maxHp,
  gold: playerStore.gold,
}))

const allClaimed = computed(() => rewardsState.value.hp && rewardsState.value.gold && rewardsState.value.card)

function handleHeal(): void {
  if (rewardsState.value.hp) return
  playerStore.healHp(75)
  rewardsState.value.hp = true
}

function handleGold(): void {
  if (rewardsState.value.gold) return
  playerStore.addGold(30)
  rewardsState.value.gold = true
}

function handleCardClick(card: CardInfo): void {
  selectedCardId.value = selectedCardId.value === card.id ? null : card.id
}

function handleCardClaim(): void {
  if (rewardsState.value.card) return
  const card = newCards.value.find((c) => c.id === selectedCardId.value)
  if (!card) return
  const type = mapCardTitleToDeckType(card.title)
  playerStore.addCard(type)
  // 新規カードはデッキ追加時に [新規] タグを持たせない
  rewardsState.value.card = true
  // 選択状態は固定し、リストは表示を維持する（非操作化は template 側で）
}

function mapCardTitleToDeckType(title: string) {
  if (title.includes('乱れ突き')) return 'flurry'
  if (title.includes('粘液')) return 'mucus-shot'
  if (title.includes('酸')) return 'acid-spit'
  if (title.includes('毒')) return 'poison-sting'
  if (title.includes('血')) return 'blood-suck'
  if (title.includes('たいあたり')) return 'tackle'
  return 'heaven-chain'
}

async function handleReturnToField(): Promise<void> {
  if (!allClaimed.value) return
  fieldStore.markCurrentCleared()
  await router.push('/field')
}
</script>

<template>
  <div class="victory-demo">
    <div class="modal">
      <header class="modal-header">
        <h1>勝利報酬（デモ）</h1>
        <div class="status">
          <span>HP: {{ playerStatus.hp }} / {{ playerStatus.maxHp }}</span>
          <span>Gold: {{ playerStatus.gold }}</span>
        </div>
      </header>

      <section class="rewards">
        <h2>報酬リスト</h2>
        <ul>
          <li :class="{ claimed: rewardsState.hp }">
            <button type="button" :disabled="rewardsState.hp" @click="handleHeal">HP回復 (+75)</button>
          </li>
          <li :class="{ claimed: rewardsState.gold }">
            <button type="button" :disabled="rewardsState.gold" @click="handleGold">所持金 +30</button>
          </li>
          <li :class="{ claimed: rewardsState.card }">
            <div class="card-reward">
              <div class="card-reward__actions">
                <span>新規カードを1枚獲得</span>
                <button type="button" :disabled="rewardsState.card || !selectedCardId" @click="handleCardClaim">獲得する</button>
              </div>
              <CardList
                :cards="newCards"
                title="[新規]カード候補"
                :selectable="true"
                :hover-effect="!rewardsState.card"
                :selected-card-id="selectedCardId"
                :force-playable="true"
                :gap="50"
                @card-click="rewardsState.card ? () => {} : handleCardClick"
              />
              <p v-if="rewardsState.card" class="card-claimed">カード報酬は受け取り済みです。</p>
            </div>
          </li>
        </ul>
      </section>

      <footer class="modal-footer">
        <button type="button" class="return-button" :disabled="!allClaimed" @click="handleReturnToField">
          フィールドに戻る
        </button>
        <p class="note">※全報酬を受け取ると戻れます（デモ用）</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.victory-demo {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top, rgba(34, 28, 63, 0.95), rgba(9, 9, 14, 0.95));
  color: #f5f2ff;
  padding: 24px;
  box-sizing: border-box;
}

.modal {
  width: min(960px, 100%);
  background: rgba(18, 16, 28, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 18px 38px rgba(0, 0, 0, 0.45);
}

.modal-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
}

.status {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 14px;
  color: rgba(245, 242, 255, 0.8);
}

.rewards ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rewards li {
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.rewards li.claimed {
  opacity: 0.6;
}

.rewards button {
  background: rgba(255, 227, 115, 0.9);
  color: #2d1a0f;
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 700;
  cursor: pointer;
}

.rewards button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-reward__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.card-claimed {
  margin: 8px 0 0;
  color: rgba(245, 242, 255, 0.8);
}

.modal-footer {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.return-button {
  background: linear-gradient(90deg, #78ffd6, #6e8bff);
  color: #0d0d1a;
  border: none;
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 800;
  cursor: pointer;
}

.return-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.note {
  margin: 0;
  color: rgba(245, 242, 255, 0.72);
  font-size: 13px;
}
</style>

<script lang="ts">
// モック用データ生成
function buildMockNewCards(): CardInfo[] {
  const newTag: CardTagInfo = { id: 'tag-newly-created', label: '新規' }
  const memoryTag: CardTagInfo = { id: 'tag-memory', label: '記憶' }
  return [
    {
      id: 'mock-new-1',
      title: 'たいあたり',
      type: 'attack',
      cost: 1,
      illustration: '🗡️',
      description: '',
      attackStyle: 'single',
      damageAmount: 20,
      damageCount: 1,
      categoryTags: [memoryTag, newTag],
      effectTags: [],
      primaryTags: [],
      affordable: true,
      disabled: false,
    },
    {
      id: 'mock-new-2',
      title: '粘液飛ばし',
      type: 'attack',
      cost: 1,
      illustration: '🧪',
      description: '',
      attackStyle: 'single',
      damageAmount: 5,
      damageCount: 1,
      categoryTags: [memoryTag, newTag],
      effectTags: [],
      primaryTags: [],
      affordable: true,
      disabled: false,
    },
    {
      id: 'mock-new-3',
      title: '乱れ突き',
      type: 'attack',
      cost: 1,
      illustration: '⚔️',
      description: '',
      attackStyle: 'multi',
      damageAmount: 10,
      damageCount: 2,
      categoryTags: [memoryTag, newTag],
      effectTags: [],
      primaryTags: [],
      affordable: true,
      disabled: false,
    },
  ]
}
</script>
