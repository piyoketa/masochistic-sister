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
import type { CardInfo, CardTagInfo, DescriptionSegment } from '@/types/battle'
import type { EnemySelectionTheme } from '@/types/selectionTheme'
import { usePlayerStore } from '@/stores/playerStore'
import { useFieldStore } from '@/stores/fieldStore'
import { CardRepository } from '@/domain/repository/CardRepository'
import { Card } from '@/domain/entities/Card'
import { Attack } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import type { DeckCardType } from '@/stores/playerStore'
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
  FlashbackAction,
} from '@/domain/entities/actions'
import { buildCardInfoFromCard } from '@/utils/cardInfoBuilder'

const playerStore = usePlayerStore()
playerStore.ensureInitialized()
const fieldStore = useFieldStore()
const router = useRouter()

const selectionTheme = ref<EnemySelectionTheme>('default')
const outcomes: [] = []
const states: string[] = []

const candidateTypes = computed(() => {
  const node = fieldStore.currentNode
  if (node && fieldStore.field.isCardRewardNode(node)) {
    return node.candidateActions
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

const drawnCards = ref<CardInfo[]>([])
const claimed = ref(false)

const playerHp = computed(() => ({
  current: playerStore.hp,
  max: playerStore.maxHp,
}))

const canProceed = computed(() => Boolean(drawnCards.value.length))

onMounted(() => {
  drawnCards.value = drawCards(candidateTypes.value, drawCount.value)
})

function drawCards(types: string[], count: number): CardInfo[] {
  if (count <= 0 || types.length === 0) {
    return []
  }
  const repo = new CardRepository()
  const results: CardInfo[] = []
  for (let i = 0; i < count; i += 1) {
    const randomType = types[Math.floor(Math.random() * types.length)] as DeckCardType
    const card = createCardFromType(repo, randomType)
    const info = buildCardInfo(card, `${randomType}-${i}`)
    if (info) {
      results.push(info)
    }
  }
  return results
}

function handleClaim(): void {
  if (claimed.value) return
  for (const card of drawnCards.value) {
    const type = mapTitleToDeckType(card.title)
    playerStore.addCard(type)
  }
  claimed.value = true
}

async function handleProceed(): Promise<void> {
  fieldStore.markCurrentCleared()
  await router.push('/field')
}

function mapTitleToDeckType(title: string): DeckCardType {
  if (title.includes('乱れ突き')) return 'flurry'
  if (title.includes('粘液')) return 'mucus-shot'
  if (title.includes('酸')) return 'acid-spit'
  if (title.includes('毒')) return 'poison-sting'
  if (title.includes('血')) return 'blood-suck'
  if (title.includes('再装填')) return 'reload'
  if (title.includes('不殺')) return 'non-violence-prayer'
  if (title.includes('傷の癒やし')) return 'scar-regeneration'
  if (title.includes('日課')) return 'daily-routine'
  if (title.includes('窮地')) return 'predicament'
  if (title.includes('戦いの準備')) return 'battle-prep'
  return 'heaven-chain'
}

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
    flashback: () => new Card({ action: new FlashbackAction() }),
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

function buildCardInfo(card: Card, id: string): CardInfo | null {
  return buildCardInfoFromCard(card, {
    id,
    affordable: true,
    disabled: false,
  })
}

function toTagInfos(tags?: { id?: string; name?: string; description?: string }[]): CardTagInfo[] {
  if (!tags) return []
  return tags
    .filter(
      (tag): tag is { id: string; name: string; description?: string } =>
        Boolean(tag.id) && Boolean(tag.name),
    )
    .map((tag) => ({ id: tag.id, label: tag.name, description: tag.description }))
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
            :show-hp-gauge="false"
          />
        </aside>
        <main class="main">
          <h2>獲得カード ({{ drawnCards.length }}枚)</h2>
        <CardList
          :cards="drawnCards"
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
