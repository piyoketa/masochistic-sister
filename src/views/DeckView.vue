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
import { HeavenChainAction } from '@/domain/entities/actions/HeavenChainAction'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { MasochisticAuraAction } from '@/domain/entities/actions/MasochisticAuraAction'
import { ScarRegenerationAction } from '@/domain/entities/actions/ScarRegenerationAction'
import { ReloadAction } from '@/domain/entities/actions/ReloadAction'
import { NonViolencePrayerAction } from '@/domain/entities/actions/NonViolencePrayerAction'
import { LifeDrainSkillAction } from '@/domain/entities/actions/LifeDrainSkillAction'
import { DailyRoutineAction } from '@/domain/entities/actions/DailyRoutineAction'
import { PredicamentAction } from '@/domain/entities/actions/PredicamentAction'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { MucusShotAction } from '@/domain/entities/actions/MucusShotAction'
import { AcidSpitAction } from '@/domain/entities/actions/AcidSpitAction'
import { PoisonStingAction } from '@/domain/entities/actions/PoisonStingAction'
import { BloodSuckAction } from '@/domain/entities/actions/BloodSuckAction'
import { Damages } from '@/domain/entities/Damages'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'

const router = useRouter()
const playerStore = usePlayerStore()
playerStore.ensureInitialized()

const blueprintFactories: Record<DeckCardType, () => Card> = {
  'heaven-chain': () => new Card({ action: new HeavenChainAction() }),
  'battle-prep': () => new Card({ action: new BattlePrepAction() }),
  'masochistic-aura': () => new Card({ action: new MasochisticAuraAction() }),
  'scar-regeneration': () => new Card({ action: new ScarRegenerationAction() }),
  reload: () => new Card({ action: new ReloadAction() }),
  'non-violence-prayer': () => new Card({ action: new NonViolencePrayerAction() }),
  'life-drain-skill': () => new Card({ action: new LifeDrainSkillAction() }),
  'daily-routine': () => new Card({ action: new DailyRoutineAction() }),
  predicament: () => new Card({ action: new PredicamentAction() }),
  tackle: () => new Card({ action: new TackleAction() }),
  flurry: () => new Card({ action: new FlurryAction() }),
  'mucus-shot': () => new Card({ action: new MucusShotAction() }),
  'acid-spit': () => new Card({ action: new AcidSpitAction() }),
  'poison-sting': () => new Card({ action: new PoisonStingAction() }),
  'blood-suck': () => new Card({ action: new BloodSuckAction() }),
}

const deckCards = computed<CardInfo[]>(() => {
  const repository = new CardRepository()
  const entries = playerStore.deck
    .map((blueprint, index) => {
      const card = createCardFromBlueprint(repository, blueprint)
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
  { value: 'scar-regeneration', label: '傷の癒やし' },
  { value: 'reload', label: 'リロード' },
  { value: 'non-violence-prayer', label: '不殺の祈り' },
  { value: 'life-drain-skill', label: 'ライフドレイン' },
  { value: 'daily-routine', label: '日課' },
  { value: 'predicament', label: '窮地' },
  { value: 'tackle', label: 'たいあたり' },
  { value: 'flurry', label: '乱れ突き' },
  { value: 'mucus-shot', label: '体液をかける' },
  { value: 'acid-spit', label: 'ぬるりと食いつく' },
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

function removeSelected(): void {
  const index = selectedIndex()
  if (index < 0) {
    return
  }
  playerStore.removeCardAt(index)
  selectedCardId.value = null
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

function createCardFromBlueprint(repository: CardRepository, blueprint: DeckCardBlueprint): Card {
  const factory = blueprintFactories[blueprint.type]
  if (!factory) {
    throw new Error(`未対応のカード種別 "${blueprint.type}" です`)
  }
  const baseCard = factory()
  const action = baseCard.action
  if (action instanceof Attack) {
    const base = action.baseDamages
    const amount = blueprint.overrideAmount ?? base.baseAmount
    const count = blueprint.overrideCount ?? base.baseCount
    if (amount !== base.baseAmount || count !== base.baseCount) {
      const cloned = action.cloneWithDamages(
        new Damages({ baseAmount: amount, baseCount: count, type: base.type }),
      )
      return repository.create(() => new Card({ action: cloned }))
    }
  }
  return repository.create(() => baseCard)
}

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
          @click="removeSelected"
        >
          選択カードを削除
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
</style>
