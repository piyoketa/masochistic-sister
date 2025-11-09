<!--
BattleHandArea の責務:
- 戦闘スナップショットをもとに手札カードを描画し、カード選択〜使用までのインタラクションを管理する。
- 敵ターゲットを要求するカード操作では、親コンポーネントへ非同期に対象取得を依頼する。
- 手札表示に必要な説明文・タグ情報など UI 向けデータを整形する。

責務ではないこと:
- ViewManager へのカード使用リクエスト送信、敵エリアの選択状態管理は行わず、emit で親へ委譲する。
- 戦闘の進行状態（ターン管理やログ更新）の制御は担当しない。

主な通信相手とインターフェース:
- BattleView（親）: props で Snapshot や入力ロック状態、target 選択用の関数を受取り、`play-card` / `update-footer` / `reset-footer` / `error` / `hide-overlay` を emit。
  フッターメッセージ更新などの UI 全体制御を親へ委譲する。
- ActionCard: 各カードのレンダリングを担当する既存コンポーネント。`CardInfo` と操作情報を渡し、クリックイベントで選択を検知する。
-->
<script setup lang="ts">
import { computed, reactive, ref, watch, onBeforeUnmount } from 'vue'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { Card } from '@/domain/entities/Card'
import type { Enemy } from '@/domain/entities/Enemy'
import ActionCard from '@/components/ActionCard.vue'
import type { CardInfo, CardTagInfo, AttackStyle } from '@/types/battle'
import { TargetEnemyOperation, type CardOperation } from '@/domain/entities/operations'
import { Attack } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import type { ViewManager } from '@/view/ViewManager'
import type { CardTag } from '@/domain/entities/CardTag'
import type { StageEventPayload } from '@/types/animation'

interface HandEntry {
  key: string
  info: CardInfo
  card: Card
  id?: number
  operations: string[]
  affordable: boolean
}

const props = defineProps<{
  snapshot: BattleSnapshot | undefined
  hoveredEnemyId: number | null
  isInitializing: boolean
  errorMessage: string | null
  isPlayerTurn: boolean
  isInputLocked: boolean
  viewManager: ViewManager
  requestEnemyTarget: () => Promise<number>
  cancelEnemySelection: () => void
  stageEvent: StageEventPayload | null
}>()

const emit = defineEmits<{
  (event: 'play-card', payload: { cardId: number; operations: CardOperation[] }): void
  (event: 'update-footer', message: string): void
  (event: 'reset-footer'): void
  (event: 'error', message: string): void
  (event: 'hide-overlay'): void
}>()

const interactionState = reactive<{
  selectedCardKey: string | null
  selectedCardId: number | null
  isAwaitingEnemy: boolean
}>({
  selectedCardKey: null,
  selectedCardId: null,
  isAwaitingEnemy: false,
})

const hoveredCardKey = ref<string | null>(null)
const processedStageBatchIds = new Set<string>()
const handOverflowOverlayMessage = ref<string | null>(null)
let handOverflowTimer: ReturnType<typeof window.setTimeout> | null = null

const supportedOperations = new Set<string>([TargetEnemyOperation.TYPE])

const handEntries = computed<HandEntry[]>(() => {
  const current = props.snapshot
  if (!current) {
    return []
  }

  const currentMana = current.player.currentMana
  const entries = current.hand.map((card, index) => buildHandEntry(card, index, currentMana))
  const regularCards = entries.filter((entry) => entry.card.type !== 'status')
  const statusCards = entries.filter((entry) => entry.card.type === 'status')
  return [...regularCards, ...statusCards]
})

const hasCards = computed(() => handEntries.value.length > 0)
const handCount = computed(() => props.snapshot?.hand.length ?? 0)
const handLimit = computed(() => props.viewManager.battle?.hand.maxSize() ?? 10)
const deckCount = computed(() => props.snapshot?.deck.length ?? 0)
const discardCount = computed(() => props.snapshot?.discardPile.length ?? 0)

const hoveredCardIndex = computed(() =>
  hoveredCardKey.value
    ? handEntries.value.findIndex((entry) => entry.key === hoveredCardKey.value)
    : -1,
)

function cardWrapperClasses(index: number): Record<string, boolean> {
  const hoveredIndex = hoveredCardIndex.value
  return {
    'hand-card-wrapper--hovered': hoveredIndex === index,
    'hand-card-wrapper--adjacent-left': hoveredIndex !== -1 && index === hoveredIndex - 1,
    'hand-card-wrapper--adjacent-right': hoveredIndex !== -1 && index === hoveredIndex + 1,
  }
}

function buildHandEntry(card: Card, index: number, currentMana: number): HandEntry {
  const definition = card.definition
  const identifier = card.id !== undefined ? `card-${card.id}` : `card-${index}`
  const operations = definition.operations ?? []
  const affordable = card.cost <= currentMana

  const {
    description,
    descriptionSegments,
    attackStyle,
    primaryTags,
    effectTags,
    categoryTags,
  } = buildCardPresentation(card, index)

  return {
    key: identifier,
    info: {
      id: identifier,
      title: card.title,
      type: card.type,
      cost: card.cost,
      illustration: definition.image ?? '🂠',
      description,
      descriptionSegments,
      attackStyle,
      primaryTags,
      effectTags,
      categoryTags,
    },
    card,
    id: card.id,
    operations,
    affordable,
  }
}

function buildCardPresentation(card: Card, index: number): {
  description: string
  descriptionSegments?: Array<{ text: string; highlighted?: boolean }>
  attackStyle?: AttackStyle
  primaryTags: CardTagInfo[]
  effectTags: CardTagInfo[]
  categoryTags: CardTagInfo[]
} {
  const definition = card.definition
  const primaryTags: CardTagInfo[] = []
  const effectTags: CardTagInfo[] = []
  const categoryTags: CardTagInfo[] = []
  const seenTagIds = new Set<string>()

  let description = card.description
  let descriptionSegments: Array<{ text: string; highlighted?: boolean }> | undefined
  let attackStyle: AttackStyle | undefined

  addTagEntry(definition.type, primaryTags, seenTagIds, (tag) => tag.name)
  if ('target' in definition) {
    addTagEntry(definition.target, primaryTags, seenTagIds, (tag) => tag.name)
  }
  addTagEntries(effectTags, card.effectTags)
  addTagEntries(categoryTags, card.categoryTags, (tag) => tag.name)

  const action = card.action
  const battle = props.viewManager.battle

  if (action instanceof Attack) {
    const damages = action.baseDamages
    const formatted = action.describeForPlayerCard({
      baseDamages: damages,
      displayDamages: damages,
      inflictedStates: action.inflictStatePreviews,
    })
    description = formatted.label
    descriptionSegments = formatted.segments

    const targetEnemyId = props.hoveredEnemyId
    if (battle && interactionState.selectedCardKey === `card-${card.id ?? index}` && targetEnemyId !== null) {
      const enemy = battle.enemyTeam.findEnemy(targetEnemyId) as Enemy | undefined
      if (enemy) {
        const calculatedDamages = new Damages({
          baseAmount: damages.baseAmount,
          baseCount: damages.baseCount,
          type: damages.type,
          attackerStates: battle.player.getStates(),
          defenderStates: enemy.getStates(),
        })
        const recalculated = action.describeForPlayerCard({
          baseDamages: damages,
          displayDamages: calculatedDamages,
          inflictedStates: action.inflictStatePreviews,
        })
        description = recalculated.label
        descriptionSegments = recalculated.segments
      }
    }

    const typeTagId = definition.type.id
    if (typeTagId === 'tag-type-multi-attack') {
      attackStyle = 'multi'
    } else if (typeTagId === 'tag-type-single-attack') {
      attackStyle = 'single'
    } else {
      const count = Math.max(1, Math.floor(damages.baseCount ?? 1))
      attackStyle = count > 1 ? 'multi' : 'single'
    }
  }

  return { description, descriptionSegments, attackStyle, primaryTags, effectTags, categoryTags }
}

function addTagEntry(
  tag: CardTag | undefined,
  entries: CardTagInfo[],
  registry: Set<string>,
  formatter: (tag: CardTag) => string = (candidate) => candidate.name,
): void {
  if (!tag || registry.has(tag.id)) {
    return
  }
  registry.add(tag.id)
  entries.push({
    id: tag.id,
    label: formatter(tag),
    description: tag.description,
  })
}

function addTagEntries(
  entries: CardTagInfo[],
  tags?: readonly CardTag[],
  formatter: (tag: CardTag) => string = (candidate) => candidate.name,
): void {
  if (!tags) {
    return
  }
  for (const tag of tags) {
    if (entries.some((existing) => existing.id === tag.id)) {
      continue
    }
    entries.push({
      id: tag.id,
      label: formatter(tag),
      description: tag.description,
    })
  }
}

function isCardDisabled(entry: HandEntry): boolean {
  if (props.isInputLocked) {
    return true
  }
  if (!props.isPlayerTurn) {
    return true
  }
  if (!entry.affordable) {
    return true
  }
  if (interactionState.isAwaitingEnemy) {
    return interactionState.selectedCardKey !== entry.key
  }
  return false
}


function handleCardHoverStart(entry: HandEntry): void {
  if (interactionState.isAwaitingEnemy) {
    return
  }
  hoveredCardKey.value = entry.key
  emit('update-footer', '左クリック：使用　右クリック：詳細')
}

function handleCardHoverEnd(): void {
  if (interactionState.isAwaitingEnemy) {
    return
  }
  hoveredCardKey.value = null
  emit('reset-footer')
}

async function handleCardClick(entry: HandEntry): Promise<void> {
  if (props.isInputLocked || !props.isPlayerTurn || !entry.affordable) {
    return
  }

  if (interactionState.isAwaitingEnemy && interactionState.selectedCardKey !== entry.key) {
    return
  }

  if (entry.id === undefined) {
    emit('error', 'カードにIDが割り当てられていません')
    return
  }

  interactionState.selectedCardKey = entry.key
  interactionState.selectedCardId = entry.id

  if (entry.operations.length === 0) {
    emit('play-card', { cardId: entry.id, operations: [] })
    resetSelection()
    return
  }

  const unsupported = entry.operations.filter((operation) => !supportedOperations.has(operation))
  if (unsupported.length > 0) {
    emit(
      'error',
      `未対応の操作が含まれているため、このカードは使用できません (${unsupported.join(', ')})`,
    )
    resetSelection()
    emit('hide-overlay')
    return
  }

  try {
    await executeOperations(entry)
  } catch (error) {
    if (error instanceof Error) {
      emit('error', error.message)
    } else {
      emit('error', String(error))
    }
    resetSelection()
  }
}

async function executeOperations(entry: HandEntry): Promise<void> {
  const collectedOperations: CardOperation[] = []

  for (const operationType of entry.operations) {
    if (operationType === TargetEnemyOperation.TYPE) {
      interactionState.isAwaitingEnemy = true
      emit('update-footer', '対象の敵を選択：左クリックで決定　右クリックでキャンセル')
      try {
        const enemyId = await props.requestEnemyTarget()
        collectedOperations.push({
          type: TargetEnemyOperation.TYPE,
          payload: enemyId,
        })
      } finally {
        interactionState.isAwaitingEnemy = false
        emit('reset-footer')
      }
      continue
    }

    throw new Error(`未対応の操作 ${operationType} です`)
  }

  const cardId = interactionState.selectedCardId
  if (cardId === null) {
    throw new Error('カード使用に必要な情報が不足しています')
  }

  emit('play-card', { cardId, operations: collectedOperations })
  resetSelection({ keepSelection: false })
}

function resetSelection(options?: { keepSelection?: boolean }): void {
  interactionState.isAwaitingEnemy = false
  if (!options?.keepSelection) {
    interactionState.selectedCardKey = null
    interactionState.selectedCardId = null
  }
  hoveredCardKey.value = null
  emit('reset-footer')
  emit('hide-overlay')
}

function cancelSelection(): void {
  if (interactionState.isAwaitingEnemy) {
    props.cancelEnemySelection()
  }
  resetSelection()
}

defineExpose({ resetSelection, cancelSelection })

watch(
  () => props.stageEvent,
  (event) => {
    if (!event || !event.batchId || processedStageBatchIds.has(event.batchId)) {
      return
    }
    processedStageBatchIds.add(event.batchId)
    if (processedStageBatchIds.size > 500) {
      processedStageBatchIds.clear()
      processedStageBatchIds.add(event.batchId)
    }
    const stage = (event.metadata?.stage as string | undefined) ?? undefined
    if (!stage) {
      return
    }
    if (stage === 'deck-draw') {
      handleDeckDrawStage(event)
    }
  },
)

function handleDeckDrawStage(event: StageEventPayload): void {
  if (event.metadata?.handOverflow) {
    showHandOverflowOverlay()
  }
}

function showHandOverflowOverlay(): void {
  handOverflowOverlayMessage.value = '手札が満杯です！'
  if (handOverflowTimer) {
    window.clearTimeout(handOverflowTimer)
  }
  handOverflowTimer = window.setTimeout(() => {
    handOverflowOverlayMessage.value = null
    handOverflowTimer = null
  }, 1200)
}

onBeforeUnmount(() => {
  if (handOverflowTimer) {
    window.clearTimeout(handOverflowTimer)
    handOverflowTimer = null
  }
})
</script>

<template>
  <section class="hand-zone">
    <div v-if="errorMessage" class="zone-message zone-message--error">
      {{ errorMessage }}
    </div>
    <div v-else-if="isInitializing" class="zone-message">カード情報を読み込み中...</div>
    <div v-else-if="!hasCards" class="zone-message">手札は空です</div>
    <TransitionGroup v-else name="hand-card" tag="div" class="hand-track">
      <div
        v-for="(entry, index) in handEntries"
        :key="entry.key"
        class="hand-card-wrapper"
        :class="cardWrapperClasses(index)"
      >
        <ActionCard
          v-bind="entry.info"
          :operations="entry.operations"
          :affordable="entry.affordable"
          :selected="interactionState.selectedCardKey === entry.key"
          :disabled="isCardDisabled(entry)"
          @click="handleCardClick(entry)"
          @mouseenter="() => handleCardHoverStart(entry)"
          @mouseleave="handleCardHoverEnd"
        />
      </div>
    </TransitionGroup>
    <transition name="hand-overlay">
      <div v-if="handOverflowOverlayMessage" class="hand-overlay">
        {{ handOverflowOverlayMessage }}
      </div>
    </transition>
    <div class="hand-counter hand-counter--discard hand-pile">
      <span class="pile-icon pile-icon--discard" aria-hidden="true"></span>
      <span class="pile-label">捨て札 {{ discardCount }}</span>
    </div>
    <div class="hand-counter hand-counter--deck hand-pile">
      <span class="pile-icon pile-icon--deck" aria-hidden="true"></span>
      <span class="pile-label">山札 {{ deckCount }}</span>
    </div>
    <div class="hand-counter hand-counter--hand hand-pile hand-pile--hand">
      <span class="pile-label">手札 {{ handCount }} / {{ handLimit }}</span>
    </div>
  </section>
</template>

<style scoped>
.hand-zone {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30px 32px 72px;
  min-height: 210px;
  position: relative;
}

.hand-counter {
  position: absolute;
  bottom: 20px;
  color: rgba(240, 235, 250, 0.9);
  font-size: 12px;
  letter-spacing: 0.05em;
  z-index: 4;
}

.hand-counter--discard {
  left: 32px;
}

.hand-counter--deck {
  right: 32px;
}

.hand-counter--hand {
  left: 50%;
  transform: translateX(-50%);
}

.hand-pile {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hand-pile--hand .pile-label {
  font-weight: 600;
}

.hand-overlay {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 16px 32px;
  border-radius: 18px;
  background: rgba(16, 16, 26, 0.86);
  color: #fff7ea;
  font-size: 18px;
  letter-spacing: 0.08em;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 18px 30px rgba(0, 0, 0, 0.5);
  pointer-events: none;
}

.hand-overlay-enter-active,
.hand-overlay-leave-active {
  transition: opacity 0.2s ease;
}

.hand-overlay-enter-from,
.hand-overlay-leave-to {
  opacity: 0;
}

.pile-icon {
  position: relative;
  width: 20px;
  height: 26px;
  border-radius: 4px;
  background: rgba(90, 90, 110, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.pile-icon::after,
.pile-icon::before {
  content: '';
  position: absolute;
  left: 3px;
  right: 3px;
  height: 2px;
  background: rgba(255, 255, 255, 0.35);
  border-radius: 1px;
}

.pile-icon::after {
  top: 8px;
}

.pile-icon::before {
  bottom: 8px;
}

.pile-icon--deck {
  background: rgba(70, 110, 220, 0.4);
}

.pile-icon--discard {
  background: rgba(220, 90, 110, 0.35);
}

.hand-track {
  --card-width: 150px;
  --card-overlap: 48px;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-end;
  gap: 0;
  min-height: 150px;
}

.hand-card-wrapper {
  position: relative;
  width: var(--card-width);
  margin-left: calc(-1 * var(--card-overlap));
  transition: transform 0.2s ease, z-index 0.2s ease;
  z-index: 1;
}

.hand-card-wrapper:first-child {
  margin-left: 0;
}

.hand-card-wrapper--hovered {
  z-index: 3;
  transform: translateY(-8px);
}

.hand-card-wrapper--adjacent-left {
  z-index: 1;
  transform: translateX(-27px);
}

.hand-card-wrapper--adjacent-right {
  z-index: 1;
  transform: translateX(27px);
}

.zone-message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  border-radius: 12px;
  background: rgba(24, 22, 26, 0.78);
  color: #f5f0f7;
  font-size: 14px;
  letter-spacing: 0.08em;
}

.zone-message--error {
  background: rgba(210, 48, 87, 0.18);
  border: 1px solid rgba(210, 48, 87, 0.4);
  color: #ff9fb3;
}
</style>
