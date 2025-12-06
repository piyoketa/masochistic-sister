<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import CardList from '@/components/CardList.vue'
import type { CardInfo, CardTagInfo, DescriptionSegment, AttackStyle } from '@/types/battle'
import {
  usePlayerStore,
  type DeckCardBlueprint,
  type DeckCardType,
} from '@/stores/playerStore'
import { CardRepository } from '@/domain/repository/CardRepository'
import { Card } from '@/domain/entities/Card'
import { Attack } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'
import { shopManager } from '@/domain/shop/ShopManager'
import { getRelicInfo } from '@/domain/entities/relics/relicLibrary'
import { useActionCardOverlay } from '@/composables/actionCardOverlay'
import { useRelicCardOverlay } from '@/composables/relicCardOverlay'
import { useAudioStore } from '@/stores/audioStore'
import { createCardFromBlueprint } from '@/domain/library/Library'

const router = useRouter()
const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const audioStore = useAudioStore()
const actionOverlay = useActionCardOverlay()
const relicOverlay = useRelicCardOverlay()
// デッキ編集画面に入るタイミングでショップ品揃えを最低限保証しておく
shopManager.ensureOffers(playerStore.relics)

const deckCards = computed<CardInfo[]>(() => {
  const repository = new CardRepository()
  const entries = playerStore.deck
    .map((blueprint, index) => {
      const card = createCardFromBlueprint(blueprint, repository)
      const info = buildCardInfo(card, index)
      return info ? { info, deckIndex: index } : null
    })
    .filter(
      (entry): entry is { info: CardInfo; deckIndex: number } =>
        entry !== null && entry.info !== null,
    )
  const sorted = entries
    .map(({ info, deckIndex }) => ({
      ...info,
      id: `deck-card-${deckIndex}`,
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'ja'))
  return sorted
})

const selectedCardId = ref<string | null>(null)
const newCardType = ref<DeckCardType>('heaven-chain')

const addableOptions: Array<{ value: DeckCardType; label: string }> = [
  { value: 'heaven-chain', label: '天の鎖' },
  { value: 'battle-prep', label: '戦いの準備' },
  { value: 'masochistic-aura', label: '被虐のオーラ' },
  { value: 'scar-regeneration', label: '疼き' },
  { value: 'reload', label: '再装填' },
  { value: 'non-violence-prayer', label: '不殺の祈り' },
  { value: 'life-drain-skill', label: 'ライフドレイン' },
  { value: 'daily-routine', label: '日課' },
  { value: 'predicament', label: '窮地' },
  { value: 'tackle', label: 'たいあたり' },
  { value: 'flurry', label: '乱れ突き' },
  { value: 'mucus-shot', label: '体液をかける' },
  { value: 'acid-spit', label: '酸を吐く' },
  { value: 'poison-sting', label: '毒針' },
  { value: 'blood-suck', label: '血吸い' },
]

function handleCardClick(card: CardInfo): void {
  selectedCardId.value = selectedCardId.value === card.id ? null : card.id
  syncAttackEditor()
}

const playerHp = computed(() => ({
  current: playerStore.hp,
  max: playerStore.maxHp,
}))

const playerGold = computed(() => playerStore.gold)
const editHp = ref<number>(playerStore.hp)
const editMaxHp = ref<number>(playerStore.maxHp)
const editGold = ref<number>(playerStore.gold)
const shopState = ref(shopManager.getOffers())

function applyPlayerStatus(): void {
  // デッキ編集画面ではHP/最大HP/所持金も調整できるようにする
  playerStore.setMaxHp(editMaxHp.value)
  playerStore.setHp(editHp.value)
  playerStore.setGold(editGold.value)
  // フォーム値を最新ストア値で揃えておく
  editHp.value = playerStore.hp
  editMaxHp.value = playerStore.maxHp
  editGold.value = playerStore.gold
}

function refreshShopState(): void {
  shopState.value = shopManager.getOffers()
}

function selectedIndex(): number {
  const id = selectedCardId.value
  if (!id) {
    return -1
  }
  const match = id.match(/^deck-card-(\d+)$/)
  if (!match) {
    return -1
  }
  return Number(match[1])
}

function sellSelected(): void {
  const index = selectedIndex()
  if (index < 0) {
    return
  }
  const info = selectedCardInfo.value
  const price = shopManager.calculateSellPrice(info)
  // 売却時にゴールドを加算する。売値0Gのカードも削除自体は可能とする。
  if (price > 0) {
    playerStore.addGold(price)
  }
  playerStore.removeCardAt(index)
  selectedCardId.value = null
  syncAttackEditor()
}

function duplicateSelected(): void {
  const index = selectedIndex()
  if (index < 0) {
    return
  }
  playerStore.duplicateCardAt(index)
}

function addCard(): void {
  playerStore.addCard(newCardType.value)
}

const editAmount = ref<number | null>(null)
const editCount = ref<number | null>(null)

const selectedCardInfo = computed(
  () => deckCards.value.find((card) => card.id === selectedCardId.value) ?? null,
)
const selectedCardIsAttack = computed(() => selectedCardInfo.value?.type === 'attack')
const selectedSellPrice = computed(() => shopManager.calculateSellPrice(selectedCardInfo.value))
const sellButtonLabel = computed(() => {
  if (!selectedCardInfo.value) {
    return '選択カードを売る'
  }
  return `選択カードを売る (+${selectedSellPrice.value}G)`
})

function buyHeal(): void {
  const price = shopState.value.heal.price
  if (playerStore.gold < price) {
    return
  }
  playerStore.spendGold(price)
  playerStore.healHp(shopState.value.heal.amount)
  audioStore.playSe('/sounds/fields/gain_hp.mp3')
  syncStatusEditors()
  shopManager.markHealPurchased()
  refreshShopState()
}

function buyCard(offer: (typeof shopState.value.cards)[number]): void {
  if (playerStore.gold < offer.price) {
    return
  }
  playerStore.spendGold(offer.price)
  playerStore.addCard(offer.deckType)
  syncStatusEditors()
  shopManager.markCardSold(offer.deckType)
  refreshShopState()
}

function buyRelic(offer: (typeof shopState.value.relics)[number]): void {
  if (playerStore.gold < offer.price) {
    return
  }
  if (playerStore.relics.includes(offer.relicClassName)) {
    return
  }
  playerStore.spendGold(offer.price)
  playerStore.addRelic(offer.relicClassName)
  syncStatusEditors()
  shopManager.markRelicSold(offer.relicClassName)
  refreshShopState()
}

function syncStatusEditors(): void {
  editHp.value = playerStore.hp
  editMaxHp.value = playerStore.maxHp
  editGold.value = playerStore.gold
}

function resolveCardLabel(deckType: DeckCardType): string {
  const found = addableOptions.find((opt) => opt.value === deckType)
  return found?.label ?? deckType
}

function resolveRelicLabel(className: string): string {
  return getRelicInfo(className)?.name ?? className
}

function showCardOverlay(deckType: DeckCardType, event: MouseEvent): void {
  actionOverlay.showFromBlueprint({ type: deckType }, { x: event.clientX, y: event.clientY })
}

function hideCardOverlay(): void {
  actionOverlay.hide()
}

function showRelicOverlay(className: string, event: MouseEvent): void {
  relicOverlay.showByClassName(className, { x: event.clientX, y: event.clientY })
}

function hideRelicOverlay(): void {
  relicOverlay.hide()
}

function syncAttackEditor(): void {
  const info = selectedCardInfo.value
  if (!info || info.type !== 'attack') {
    editAmount.value = null
    editCount.value = null
    return
  }
  editAmount.value = info.damageAmount ?? null
  editCount.value = info.attackStyle === 'multi' ? info.damageCount ?? null : null
}

function applyAttackOverride(): void {
  if (!selectedCardIsAttack.value) {
    return
  }
  const index = selectedIndex()
  if (index < 0) {
    return
  }
  const amount = editAmount.value ?? undefined
  const count = editCount.value ?? undefined
  playerStore.updateAttackOverride(index, { amount, count })
}

syncAttackEditor()

function buildCardInfo(card: Card, index: number): CardInfo | null {
  return buildCardInfoFromCard(card, {
    id: `deck-card-${index}`,
    affordable: true,
    disabled: false,
  })
}

function toTagInfos(tags?: { id?: string; name?: string; description?: string }[]): CardTagInfo[] {
  if (!tags) {
    return []
  }
  return tags
    .filter(
      (tag): tag is { id: string; name: string; description?: string } =>
        Boolean(tag.id) && Boolean(tag.name),
    )
    .map((tag) => ({
      id: tag.id,
      label: tag.name,
      description: tag.description,
    }))
}

function deriveAttackStyle(type: Attack['baseProfile']['type']): AttackStyle {
  return type === 'multi' ? 'multi' : 'single'
}
</script>

<template>
  <div class="deck-view">
    <header class="deck-header">
      <h1>所持デッキ</h1>
      <p>プレイヤーストアに保存されている現在のデッキを表示します。</p>
      <div class="hp-summary">
        <span class="hp-label">HP</span>
        <span class="hp-value">{{ playerHp.current }} / {{ playerHp.max }}</span>
        <span class="hp-label">Gold</span>
        <span class="hp-value">{{ playerGold }}</span>
        <button type="button" class="deck-button deck-button--link" @click="router.push('/field')">
          フィールドへ戻る
        </button>
      </div>
    </header>
    <div class="deck-actions">
      <div class="add-row">
        <label class="add-label" for="add-card">カードを追加</label>
        <select id="add-card" v-model="newCardType" class="add-select">
          <option v-for="opt in addableOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button type="button" class="deck-button" @click="addCard">追加</button>
      </div>
      <div class="edit-row">
        <button
          type="button"
          class="deck-button"
          :disabled="!selectedCardId"
          @click="duplicateSelected"
        >
          選択カードを複製
        </button>
        <button
          type="button"
          class="deck-button deck-button--danger"
          :disabled="!selectedCardId"
          @click="sellSelected"
        >
          {{ sellButtonLabel }}
        </button>
        <span v-if="selectedCardId" class="sell-price">売値: {{ selectedSellPrice }}G</span>
      </div>
      <div class="status-row">
        <div class="status-field">
          <label for="edit-max-hp">最大HP</label>
          <input id="edit-max-hp" v-model.number="editMaxHp" type="number" min="1" />
        </div>
        <div class="status-field">
          <label for="edit-hp">現在HP</label>
          <input id="edit-hp" v-model.number="editHp" type="number" min="0" />
        </div>
        <div class="status-field">
          <label for="edit-gold">所持金</label>
          <input id="edit-gold" v-model.number="editGold" type="number" min="0" />
        </div>
        <button type="button" class="deck-button" @click="applyPlayerStatus">
          ステータスを更新
        </button>
      </div>
    </div>
    <CardList
      :cards="deckCards"
      title="デッキ"
      :no-height-limit="true"
      :force-playable="true"
      :gap="20"
      selectable
      :selected-card-id="selectedCardId"
      @card-click="handleCardClick"
    />
    <div v-if="selectedCardIsAttack" class="attack-edit">
      <h3>攻撃カード設定</h3>
      <div class="attack-edit__row">
        <label>攻撃力</label>
        <input v-model.number="editAmount" type="number" min="0" />
      </div>
      <div class="attack-edit__row">
        <label>攻撃回数</label>
        <input v-model.number="editCount" type="number" min="1" />
      </div>
      <button type="button" class="deck-button" @click="applyAttackOverride" :disabled="!selectedCardIsAttack">
        上記の値を適用
      </button>
    </div>
    <div class="shop-section">
      <h2>SHOP</h2>
      <div class="shop-grid">
        <div class="shop-card">
          <div class="shop-title">HP回復 +{{ shopState.heal.amount }}</div>
          <div class="shop-price">{{ shopState.heal.price }}G</div>
          <button
            type="button"
            class="deck-button"
            :disabled="playerGold < shopState.heal.price"
            @click="buyHeal"
          >
            購入
          </button>
        </div>
        <div class="shop-card">
          <div class="shop-title">カード</div>
          <ul class="shop-list">
            <li v-for="offer in shopState.cards" :key="offer.deckType" class="shop-item">
              <div>
                <span
                  class="shop-item__name"
                  @mouseenter="(e) => showCardOverlay(offer.deckType, e as MouseEvent)"
                  @mouseleave="hideCardOverlay"
                >
                  {{ resolveCardLabel(offer.deckType) }}
                </span>
                <span v-if="offer.sale" class="shop-badge">SALE</span>
              </div>
              <div class="shop-item__actions">
                <span class="shop-price">{{ offer.price }}G</span>
                <button
                  type="button"
                  class="deck-button"
                  :disabled="playerGold < offer.price"
                  @click="buyCard(offer)"
                >
                  購入
                </button>
              </div>
            </li>
          </ul>
        </div>
        <div class="shop-card">
          <div class="shop-title">レリック</div>
          <ul class="shop-list">
            <li v-for="offer in shopState.relics" :key="offer.relicClassName" class="shop-item">
              <div>
                <span
                  class="shop-item__name"
                  @mouseenter="(e) => showRelicOverlay(offer.relicClassName, e as MouseEvent)"
                  @mouseleave="hideRelicOverlay"
                >
                  {{ resolveRelicLabel(offer.relicClassName) }}
                </span>
                <span v-if="offer.sale" class="shop-badge">SALE</span>
              </div>
              <div class="shop-item__actions">
                <span class="shop-price">{{ offer.price }}G</span>
                <button
                  type="button"
                  class="deck-button"
                  :disabled="playerGold < offer.price || playerStore.relics.includes(offer.relicClassName)"
                  @click="buyRelic(offer)"
                >
                  購入
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.deck-view {
  min-height: 100vh;
  padding: 40px clamp(20px, 5vw, 64px);
  color: #f4f1ff;
  background: radial-gradient(circle at top, rgba(34, 28, 63, 0.95), rgba(9, 9, 14, 0.95));
  box-sizing: border-box;
}

.deck-header {
  margin-bottom: 16px;
}

.deck-header h1 {
  margin: 0 0 6px;
  font-size: 24px;
  letter-spacing: 0.1em;
}

.deck-header p {
  margin: 0;
  color: rgba(244, 241, 255, 0.78);
  font-size: 14px;
}

.hp-summary {
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 700;
}

.hp-label {
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.75);
}

.hp-value {
  color: #ffe27a;
}

.deck-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.add-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.add-label {
  font-size: 14px;
}

.add-select {
  background: rgba(18, 18, 28, 0.9);
  color: #f4f1ff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 10px;
}

.edit-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.sell-price {
  color: #ffe27a;
  font-weight: 700;
}
.status-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-end;
}

.status-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-field input {
  background: rgba(18, 18, 28, 0.9);
  color: #f4f1ff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 10px;
  min-width: 120px;
}

.deck-button {
  background: rgba(255, 227, 115, 0.9);
  color: #2d1a0f;
  border: none;
  border-radius: 10px;
  padding: 6px 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
}

.deck-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.deck-button:not(:disabled):hover,
.deck-button:not(:disabled):focus-visible {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
}

.deck-button--danger {
  background: rgba(220, 90, 120, 0.92);
  color: #fff7fb;
}

.deck-button--link {
  background: rgba(120, 205, 255, 0.95);
  color: #0d1a2f;
}

.attack-edit {
  margin-top: 12px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  background: rgba(20, 16, 28, 0.85);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attack-edit h3 {
  margin: 0;
  font-size: 16px;
  letter-spacing: 0.08em;
}

.attack-edit__row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attack-edit__row input {
  background: rgba(18, 18, 28, 0.9);
  color: #f4f1ff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 10px;
  width: 100px;
}

.shop-section {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: rgba(16, 14, 24, 0.85);
}

.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  padding-bottom: 150px;
}

.shop-card {
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(24, 22, 34, 0.85);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shop-title {
  font-weight: 800;
  letter-spacing: 0.08em;
}

.shop-price {
  font-weight: 700;
  color: #ffe27a;
}

.shop-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shop-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.shop-item__name {
  font-weight: 700;
}

.shop-item__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.shop-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  background: rgba(120, 205, 255, 0.2);
  color: #85d6ff;
  border-radius: 8px;
  font-size: 11px;
  margin-left: 6px;
  border: 1px solid rgba(120, 205, 255, 0.5);
}
</style>
