<!--
RandomCardRewardView の責務:
- フィールドのランダムカード獲得マスに入った際、事前に決定された3枚の候補から1枚だけ選択・獲得させる。
- プレイヤーの基本ステータス表示と、獲得処理、フィールドへの復帰導線を提供する。

非責務:
- フィールド全体の遷移管理やノード生成。候補決定は SampleField 側で実施済みの前提。
-->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GameLayout from '@/components/GameLayout.vue'
import PlayerCardComponent from '@/components/PlayerCardComponent.vue'
import type { CardInfo } from '@/types/battle'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { usePlayerStore, type DeckCardType } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import { CardRepository } from '@/domain/repository/CardRepository'
import { Card } from '@/domain/entities/Card'
import { Attack } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import {
  HeavenChainAction,
  BattlePrepAction,
  MasochisticAuraAction,
  ScarRegenerationAction,
  ReloadAction,
  NonViolencePrayerAction,
  LifeDrainSkillAction,
  DailyRoutineAction,
  PredicamentAction,
  TackleAction,
  FlurryAction,
  MucusShotAction,
  AcidSpitAction,
  PoisonStingAction,
  BloodSuckAction,
} from '@/domain/entities/actions'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const fieldStore = useFieldStore()
const router = useRouter()

const selectionTheme = ref<EnemySelectionTheme>('default')
const outcomes: [] = []
const states: string[] = []

const selectedActions = computed<DeckCardType[]>(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isRandomCardRewardNode(node)) {
    return node.selectedActions as DeckCardType[]
  }
  return []
})

const cardInfos = ref<CardInfo[]>([])
const selectedType = ref<DeckCardType | null>(null)
const claimed = ref(false)

const playerHp = computed(() => ({
  current: playerStore.hp,
  max: playerStore.maxHp,
}))

const canClaim = computed(() => !!selectedType.value && !claimed.value)

onMounted(() => {
  cardInfos.value = selectedActions.value.map((type, index) => buildCardInfo(createCard(type), `choice-${index}`)!)
})

function createCardFromType(repository: CardRepository, type: DeckCardType): Card {
  const map: Record<DeckCardType, () => Card> = {
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
  const factory = map[type]
  if (!factory) {
    throw new Error(`未対応のカード種別: ${type}`)
  }
  const baseCard = factory()
  const action = baseCard.action
  if (action instanceof Attack) {
    const base = action.baseDamages
    const cloned = action.cloneWithDamages(
      new Damages({ baseAmount: base.baseAmount, baseCount: base.baseCount, type: base.type }),
    )
    return repository.create(() => new Card({ action: cloned }))
  }
  return repository.create(() => baseCard)
}

function createCard(type: DeckCardType): Card {
  const repo = new CardRepository()
  return createCardFromType(repo, type)
}

function buildCardInfo(card: Card, id: string): CardInfo | null {
  return buildCardInfoFromCard(card, {
    id,
    affordable: true,
    disabled: false,
  })
}

function handleSelect(type: DeckCardType): void {
  if (claimed.value) return
  selectedType.value = type
}

function handleClaim(): void {
  if (!selectedType.value || claimed.value) return
  playerStore.addCard(selectedType.value)
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
          <h1>カード獲得（3択）</h1>
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
              :show-hp-gauge="false"
            />
          </aside>
          <main class="main">
            <div class="card-grid">
              <label
                v-for="(card, idx) in cardInfos"
                :key="card.id"
                class="card-option"
                :class="{
                  'card-option--selected': selectedType === selectedActions[idx],
                  'card-option--claimed': claimed,
                }"
              >
                <input
                  class="card-option__radio"
                  type="radio"
                  name="card-selection"
                  :value="selectedActions[idx]"
                  :checked="selectedType === selectedActions[idx]"
                  :disabled="claimed"
                  @change="handleSelect(selectedActions[idx]!)"
                />
                <div class="card-option__body">
                  <div class="card-option__title">{{ card.title }}</div>
                  <div class="card-option__cost">コスト: {{ card.cost }}</div>
                  <p class="card-option__description">
                    {{ card.descriptionSegments?.map((segment) => segment.text).join(' ') ?? '' }}
                  </p>
                </div>
              </label>
            </div>
            <div class="actions">
              <button type="button" class="action-button" :disabled="!canClaim" @click="handleClaim">
                獲得
              </button>
              <button
                type="button"
                class="action-button action-button--next"
                :disabled="!cardInfos.length"
                @click="handleProceed"
              >
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

.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  align-items: start;
}

.player-area {
  position: sticky;
  top: 20px;
}

.main {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.card-option {
  position: relative;
  padding: 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.card-option--selected {
  border-color: #f6d365;
  box-shadow: 0 0 0 2px rgba(246, 211, 101, 0.4);
}

.card-option__radio {
  position: absolute;
  top: 8px;
  right: 8px;
}

.card-option__title {
  font-weight: 700;
  margin-bottom: 4px;
}

.card-option__cost {
  font-size: 13px;
  color: rgba(245, 242, 255, 0.7);
}

.card-option__description {
  font-size: 13px;
  line-height: 1.4;
  color: rgba(245, 242, 255, 0.85);
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.action-button {
  padding: 10px 16px;
  border-radius: 8px;
  background: #f6d365;
  color: #1a132b;
  border: none;
  cursor: pointer;
  font-weight: 700;
}

.action-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.action-button--next {
  background: #8bd3dd;
}
</style>
