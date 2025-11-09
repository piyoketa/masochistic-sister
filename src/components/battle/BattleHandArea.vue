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
import { computed, reactive, ref, watch, onBeforeUnmount, nextTick } from 'vue'
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

interface FloatingCardAnimation {
  key: string
  label: string
  variant: 'draw' | 'trash' | 'eliminate'
  style: {
    left: string
    top: string
    width: string
    height: string
    transform: string
  }
  active: boolean
}

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
const handZoneRef = ref<HTMLElement | null>(null)
const deckCounterRef = ref<HTMLElement | null>(null)
const discardCounterRef = ref<HTMLElement | null>(null)
const processedStageBatchIds = new Set<string>()
const handOverflowOverlayMessage = ref<string | null>(null)
let handOverflowTimer: ReturnType<typeof window.setTimeout> | null = null
const hiddenCardIds = ref<Set<number>>(new Set())
const recentCardIds = ref<Set<number>>(new Set())
const floatingCards = reactive<FloatingCardAnimation[]>([])
const pendingDrawCardIds = ref<Set<number>>(new Set())
const pendingCreateQueue: Array<{ batchId: string; count: number }> = []
const previousHandIds = ref<Set<number>>(new Set())
const pendingRemovalTimers = new Map<number, ReturnType<typeof window.setTimeout>>()
const cardElementRefs = new Map<number, HTMLElement>()
const deckDrawRetryCounters = new Map<number, number>()

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
const cardTitleMap = computed(() => {
  const map = new Map<number, string>()
  handEntries.value.forEach((entry) => {
    if (entry.id !== undefined) {
      map.set(entry.id, entry.info.title)
    }
  })
  return map
})

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
    switch (stage) {
      case 'deck-draw':
        handleDeckDrawStage(event)
        break
      case 'card-trash':
        handleCardTrashStage(event)
        break
      case 'card-eliminate':
        handleCardEliminateStage(event)
        break
      case 'card-create':
        handleCardCreateStage(event)
        break
      default:
        break
    }
  },
)

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
  pendingRemovalTimers.forEach((timer) => window.clearTimeout(timer))
  pendingRemovalTimers.clear()
})

watch(
  () => props.snapshot?.hand.map((card) => card.id).filter((id): id is number => typeof id === 'number'),
  async (handIds = []) => {
    await nextTick()
    const currentSet = new Set(handIds)
    const prevSet = previousHandIds.value
    const newlyAdded = handIds.filter((id) => !prevSet.has(id))
    processNewHandCards(newlyAdded)
    previousHandIds.value = currentSet
  },
  { immediate: true },
)

function processNewHandCards(newlyAdded: number[]): void {
  if (newlyAdded.length === 0) {
    return
  }
  for (const cardId of newlyAdded) {
    if (pendingDrawCardIds.value.has(cardId)) {
      removeFromSet(pendingDrawCardIds, cardId)
      startDeckDrawAnimation(cardId)
      continue
    }
    if (pendingCreateQueue.length > 0) {
      const request = pendingCreateQueue[0]
      request.count -= 1
      startCardCreateHighlight(cardId)
      if (request.count <= 0) {
        pendingCreateQueue.shift()
      }
    }
  }
}

function handleDeckDrawStage(event: StageEventPayload): void {
  const cardIds = extractCardIds(event.metadata)
  if (cardIds.length > 0) {
    cardIds.forEach((id) => addToSet(pendingDrawCardIds, id))
  }
  if (event.metadata?.handOverflow) {
    showHandOverflowOverlay()
  }
}

function handleCardTrashStage(event: StageEventPayload): void {
  const cardIds = extractCardIds(event.metadata)
  const titles = (event.metadata?.cardTitles as string[] | undefined) ?? []
  cardIds.forEach((id, index) => {
    const title = titles[index] ?? cardTitleMap.value.get(id) ?? 'カード'
    startCardRemovalAnimation(id, title, 'trash')
  })
}

function handleCardEliminateStage(event: StageEventPayload): void {
  const cardIds = extractCardIds(event.metadata)
  const titles = (event.metadata?.cardTitles as string[] | undefined) ?? []
  cardIds.forEach((id, index) => {
    const title = titles[index] ?? cardTitleMap.value.get(id) ?? 'カード'
    startCardRemovalAnimation(id, title, 'eliminate')
  })
}

function handleCardCreateStage(event: StageEventPayload): void {
  const count =
    (Array.isArray(event.metadata?.cards) ? event.metadata.cards.length : undefined) ??
    (Array.isArray(event.metadata?.cardIds) ? event.metadata.cardIds.length : undefined) ??
    0
  if (count > 0) {
    pendingCreateQueue.push({ batchId: event.batchId, count })
  }
}

function startDeckDrawAnimation(cardId: number, attempt = 0): void {
  const cardElement = cardElementRefs.get(cardId)
  const deckElement = deckCounterRef.value
  const zoneElement = handZoneRef.value
  if (!cardElement || !deckElement || !zoneElement) {
    const retries = deckDrawRetryCounters.get(cardId) ?? attempt
    if (retries < 5) {
      deckDrawRetryCounters.set(cardId, retries + 1)
      window.setTimeout(() => startDeckDrawAnimation(cardId, retries + 1), 50)
    } else {
      deckDrawRetryCounters.delete(cardId)
    }
    return
  }
  deckDrawRetryCounters.delete(cardId)
  const deckRect = deckElement.getBoundingClientRect()
  const targetRect = cardElement.getBoundingClientRect()
  const zoneRect = zoneElement.getBoundingClientRect()
  const label = cardTitleMap.value.get(cardId) ?? 'カード'
  hideCard(cardId)
  spawnFloatingCard({
    label,
    fromRect: deckRect,
    toRect: targetRect,
    zoneRect,
    variant: 'draw',
    onComplete: () => showCard(cardId),
  })
}

function startCardRemovalAnimation(
  cardId: number,
  label: string,
  variant: 'trash' | 'eliminate',
  attempt = 0,
): void {
  const cardElement = cardElementRefs.get(cardId)
  const zoneElement = handZoneRef.value
  const targetElement = variant === 'trash' ? discardCounterRef.value : handZoneRef.value
  if (!cardElement || !zoneElement || !targetElement) {
    if (attempt < 5) {
      const timer = window.setTimeout(
        () => startCardRemovalAnimation(cardId, label, variant, attempt + 1),
        50,
      )
      pendingRemovalTimers.set(cardId, timer)
    }
    return
  }
  const sourceRect = cardElement.getBoundingClientRect()
  const zoneRect = zoneElement.getBoundingClientRect()
  const targetRect =
    variant === 'trash'
      ? targetElement.getBoundingClientRect()
      : {
          left: sourceRect.left,
          top: sourceRect.top - 40,
          width: sourceRect.width,
          height: sourceRect.height,
        }
  hideCard(cardId)
  spawnFloatingCard({
    label,
    fromRect: sourceRect,
    toRect: targetRect,
    zoneRect,
    variant,
    onComplete: () => showCard(cardId),
  })
}

function startCardCreateHighlight(cardId: number): void {
  addToSet(recentCardIds, cardId)
  window.setTimeout(() => removeFromSet(recentCardIds, cardId), 550)
}

function spawnFloatingCard(options: {
  label: string
  fromRect: DOMRect
  toRect: DOMRect
  zoneRect: DOMRect
  variant: FloatingCardAnimation['variant']
  duration?: number
  onComplete?: () => void
}): void {
  const duration = options.duration ?? 350
  const card: FloatingCardAnimation = reactive({
    key: `floating-card-${Date.now()}-${Math.random()}`,
    label: options.label,
    variant: options.variant,
    style: {
      width: `${options.fromRect.width}px`,
      height: `${options.fromRect.height}px`,
      left: `${options.fromRect.left - options.zoneRect.left}px`,
      top: `${options.fromRect.top - options.zoneRect.top}px`,
      transform: 'translate(0, 0)',
    },
    active: false,
  })
  floatingCards.push(card)
  requestAnimationFrame(() => {
    card.style.transform = `translate(${options.toRect.left - options.fromRect.left}px, ${
      options.toRect.top - options.fromRect.top
    }px)`
    card.active = true
  })
  window.setTimeout(() => {
    const index = floatingCards.indexOf(card)
    if (index >= 0) {
      floatingCards.splice(index, 1)
    }
    options.onComplete?.()
  }, duration + 100)
}

function extractCardIds(metadata: StageEventPayload['metadata']): number[] {
  if (!metadata) {
    return []
  }
  if (Array.isArray(metadata.cardIds)) {
    return metadata.cardIds.filter((id): id is number => typeof id === 'number')
  }
  if (typeof metadata.cardId === 'number') {
    return [metadata.cardId]
  }
  return []
}

function addToSet(target: typeof pendingDrawCardIds, value: number): void {
  const clone = new Set(target.value)
  clone.add(value)
  target.value = clone
}

function removeFromSet(target: typeof pendingDrawCardIds | typeof recentCardIds, value: number): void {
  const clone = new Set(target.value)
  clone.delete(value)
  target.value = clone
}

function hideCard(cardId: number): void {
  if (cardId === undefined) {
    return
  }
  const next = new Set(hiddenCardIds.value)
  next.add(cardId)
  hiddenCardIds.value = next
}

function showCard(cardId: number): void {
  if (cardId === undefined) {
    return
  }
  const next = new Set(hiddenCardIds.value)
  next.delete(cardId)
  hiddenCardIds.value = next
}

function isCardHidden(entry: HandEntry): boolean {
  return entry.id !== undefined && hiddenCardIds.value.has(entry.id)
}

function isCardRecentlyCreated(entry: HandEntry): boolean {
  return entry.id !== undefined && recentCardIds.value.has(entry.id)
}

function registerCardElement(cardId: number | undefined, title: string, el: Element | null): void {
  if (cardId === undefined) {
    return
  }
  if (el) {
    const element = el as HTMLElement
    element.dataset.cardTitle = title
    cardElementRefs.set(cardId, element)
  } else {
    cardElementRefs.delete(cardId)
  }
}
</script>

<template>
  <section ref="handZoneRef" class="hand-zone">
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
        :class="[
          cardWrapperClasses(index),
          isCardHidden(entry) ? 'hand-card-wrapper--hidden' : '',
          isCardRecentlyCreated(entry) ? 'hand-card-wrapper--recent' : '',
        ]"
        :ref="(el) => registerCardElement(entry.id, entry.info.title, el)"
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
    <div class="hand-floating-layer" aria-hidden="true">
      <div
        v-for="ghost in floatingCards"
        :key="ghost.key"
        class="hand-floating-card"
        :class="[
          `hand-floating-card--${ghost.variant}`,
          ghost.active ? 'hand-floating-card--active' : '',
        ]"
        :style="ghost.style"
      >
        {{ ghost.label }}
      </div>
    </div>
    <transition name="hand-overlay">
      <div v-if="handOverflowOverlayMessage" class="hand-overlay">
        {{ handOverflowOverlayMessage }}
      </div>
    </transition>
    <div ref="discardCounterRef" class="hand-counter hand-counter--discard hand-pile">
      <span class="pile-icon pile-icon--discard" aria-hidden="true"></span>
      <span class="pile-label">捨て札 {{ discardCount }}</span>
    </div>
    <div ref="deckCounterRef" class="hand-counter hand-counter--deck hand-pile">
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

.hand-card-wrapper--hidden {
  visibility: hidden;
}

.hand-card-wrapper--recent {
  animation: hand-card-recent 0.45s ease;
}

@keyframes hand-card-recent {
  0% {
    transform: scale(0.9);
  }
  60% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.hand-floating-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 6;
}

.hand-floating-card {
  position: absolute;
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #1b1320;
  background: #f2e4ff;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translate3d(0, 0, 0);
  transition: transform 0.35s ease, opacity 0.35s ease;
}

.hand-floating-card--active {
  opacity: 1;
}

.hand-floating-card--trash {
  background: #f8d1d1;
}

.hand-floating-card--eliminate {
  background: #d1f3f8;
}

.hand-floating-card--eliminate.hand-floating-card--active {
  opacity: 0;
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
