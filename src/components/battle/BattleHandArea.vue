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
import ActionCard from '@/components/ActionCard.vue'
import type { CardInfo } from '@/types/battle'
import type {
  CardOperation,
  TargetEnemyAvailabilityEntry,
} from '@/domain/entities/operations'
import type { ViewManager } from '@/view/ViewManager'
import type { StageEventPayload } from '@/types/animation'
import { useHandPresentation, type HandEntry } from './composables/useHandPresentation'
import { useHandInteraction } from './composables/useHandInteraction'

interface FloatingCardAnimation {
  key: string
  info: CardInfo
  operations: string[]
  affordable: boolean
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
  (event: 'show-enemy-selection-hints', hints: TargetEnemyAvailabilityEntry[]): void
  (event: 'clear-enemy-selection-hints'): void
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
const cardCreateOverlays = ref<Array<{ key: string; info: CardInfo; id: number }>>([])
const cardCreateTimers = new Map<string, ReturnType<typeof window.setTimeout>>()
const CARD_CREATE_DURATION_MS = 1000
const ACTION_CARD_WIDTH = 94
const ACTION_CARD_HEIGHT = 140

const {
  handEntries,
  cardTitleMap,
  buildOperationContext,
  findHandEntryByCardId,
} = useHandPresentation({
  props,
  interactionState,
})
const hasCards = computed(() => handEntries.value.length > 0)
const handCount = computed(() => props.snapshot?.hand.length ?? 0)
const handLimit = computed(() => props.viewManager.battle?.hand.maxSize() ?? 10)
const deckCount = computed(() => props.snapshot?.deck.length ?? 0)
const discardCount = computed(() => props.snapshot?.discardPile.length ?? 0)

const {
  hoveredCardKey,
  handSelectionRequest,
  handleCardHoverStart,
  handleCardHoverEnd,
  handleCardClick,
  handleHandContextMenu,
  isCardDisabled,
  isHandSelectionCandidate,
  handSelectionBlockedReason,
  selectionWrapperClass,
  resetSelection,
  cancelSelection,
  cancelHandSelectionRequest,
} = useHandInteraction({
  props,
  emit,
  interactionState,
  buildOperationContext,
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
  cardCreateTimers.forEach((timer) => window.clearTimeout(timer))
  cardCreateTimers.clear()
  cancelHandSelectionRequest()
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
      const entry = findHandEntryByCardId(cardId)
      if (entry) {
        startCardCreateSequence(entry)
      } else {
        startCardCreateHighlight(cardId)
      }
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
    const fallbackTitle = titles[index] ?? cardTitleMap.value.get(id) ?? 'カード'
    const entry = findHandEntryByCardId(id)
    startCardRemovalAnimation(id, entry, 'trash', { fallbackTitle })
  })
}

function handleCardEliminateStage(event: StageEventPayload): void {
  const cardIds = extractCardIds(event.metadata)
  const titles = (event.metadata?.cardTitles as string[] | undefined) ?? []
  cardIds.forEach((id, index) => {
    const fallbackTitle = titles[index] ?? cardTitleMap.value.get(id) ?? 'カード'
    const entry = findHandEntryByCardId(id)
    startCardRemovalAnimation(id, entry, 'eliminate', { fallbackTitle })
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
  const entry = findHandEntryByCardId(cardId)
  if (!cardElement || !deckElement || !zoneElement || !entry) {
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
  hideCard(cardId)
  spawnFloatingCard({
    cardInfo: entry.info,
    operations: entry.operations,
    affordable: entry.affordable,
    fromRect: deckRect,
    toRect: targetRect,
    zoneRect,
    variant: 'draw',
    onComplete: () => showCard(cardId),
  })
}

function startCardRemovalAnimation(
  cardId: number,
  entry: HandEntry | undefined,
  variant: 'trash' | 'eliminate',
  options: { fallbackTitle?: string } = {},
  attempt = 0,
): void {
  const cardElement = cardElementRefs.get(cardId)
  const zoneElement = handZoneRef.value
  const targetElement = variant === 'trash' ? discardCounterRef.value : handZoneRef.value
  if (!cardElement || !zoneElement || !targetElement) {
    if (attempt < 5) {
      const timer = window.setTimeout(
        () => startCardRemovalAnimation(cardId, entry, variant, options, attempt + 1),
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
    cardInfo:
      entry?.info ?? buildFallbackCardInfo(cardId, options.fallbackTitle ?? 'カード'),
    operations: entry?.operations ?? [],
    affordable: entry?.affordable ?? true,
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

function startCardCreateSequence(entry: HandEntry): void {
  const cardId = entry.id
  if (cardId === undefined) {
    return
  }
  hideCard(cardId)
  const key = `card-create-${cardId}-${Date.now()}`
  cardCreateOverlays.value = [...cardCreateOverlays.value, { key, info: entry.info, id: cardId }]
  const timer = window.setTimeout(() => {
    finishCardCreateSequence(key, cardId)
  }, CARD_CREATE_DURATION_MS)
  cardCreateTimers.set(key, timer)
}

function finishCardCreateSequence(key: string, cardId: number): void {
  if (cardCreateTimers.has(key)) {
    const timer = cardCreateTimers.get(key)
    if (timer) {
      window.clearTimeout(timer)
    }
    cardCreateTimers.delete(key)
  }
  cardCreateOverlays.value = cardCreateOverlays.value.filter((item) => item.key !== key)
  showCard(cardId)
  startCardCreateHighlight(cardId)
}

function spawnFloatingCard(options: {
  cardInfo: CardInfo
  operations: string[]
  affordable: boolean
  fromRect: DOMRect
  toRect: DOMRect
  zoneRect: DOMRect
  variant: FloatingCardAnimation['variant']
  duration?: number
  onComplete?: () => void
}): void {
  const duration = options.duration ?? 300
  const revealDelay = Math.max(0, duration - 80)
  const cleanupDelay = duration + 80
  const fromCenterX = options.fromRect.left + options.fromRect.width / 2
  const fromCenterY = options.fromRect.top + options.fromRect.height / 2
  const toCenterX = options.toRect.left + options.toRect.width / 2
  const toCenterY = options.toRect.top + options.toRect.height / 2
  const width = ACTION_CARD_WIDTH
  const height = ACTION_CARD_HEIGHT
  const startLeft = fromCenterX - width / 2 - options.zoneRect.left
  const startTop = fromCenterY - height / 2 - options.zoneRect.top
  const deltaX = toCenterX - fromCenterX
  const deltaY = toCenterY - fromCenterY

  const card: FloatingCardAnimation = reactive({
    key: `floating-card-${Date.now()}-${Math.random()}`,
    info: options.cardInfo,
    operations: options.operations,
    affordable: options.affordable,
    variant: options.variant,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      left: `${startLeft}px`,
      top: `${startTop}px`,
      transform: 'translate(0, 0)',
    },
    active: false,
  })
  floatingCards.push(card)
  let revealed = false
  const reveal = () => {
    if (revealed) {
      return
    }
    revealed = true
    options.onComplete?.()
  }
  requestAnimationFrame(() => {
    card.style.transform = `translate(${deltaX}px, ${deltaY}px)`
    card.active = true
  })
  window.setTimeout(reveal, revealDelay)
  window.setTimeout(() => {
    const index = floatingCards.indexOf(card)
    if (index >= 0) {
      floatingCards.splice(index, 1)
    }
    reveal()
  }, cleanupDelay)
}

function buildFallbackCardInfo(cardId: number, title: string): CardInfo {
  return {
    id: `card-${cardId}`,
    title,
    type: 'skill',
    cost: 0,
    illustration: '🂠',
    description: title,
    primaryTags: [],
    effectTags: [],
    categoryTags: [],
  }
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

function addToSet(
  target: typeof pendingDrawCardIds | typeof recentCardIds,
  value: number,
): void {
  const current = target.value
  if (current.has(value)) {
    return
  }
  const clone = new Set(current)
  clone.add(value)
  target.value = clone
}

function removeFromSet(target: typeof pendingDrawCardIds | typeof recentCardIds, value: number): void {
  const current = target.value
  if (!current.has(value)) {
    return
  }
  const clone = new Set(current)
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
    const wrapper = el as HTMLElement
    const actionCard = wrapper.querySelector<HTMLElement>('.action-card')
    const target = actionCard ?? wrapper
    target.dataset.cardTitle = title
    cardElementRefs.set(cardId, target)
  } else {
    cardElementRefs.delete(cardId)
  }
}
</script>

<template>
  <section ref="handZoneRef" class="hand-zone" @contextmenu="handleHandContextMenu">
    <div v-if="errorMessage" class="zone-message zone-message--error">
      {{ errorMessage }}
    </div>
    <div v-else-if="isInitializing" class="zone-message">カード情報を読み込み中...</div>
    <div v-else-if="!hasCards" class="zone-message">手札は空です</div>
    <transition name="hand-selection-banner">
      <div v-if="handSelectionRequest" class="hand-selection-banner">
        {{ handSelectionRequest.message }}
      </div>
    </transition>
    <TransitionGroup name="card-create" tag="div" class="card-create-overlay">
      <div v-for="item in cardCreateOverlays" :key="item.key" class="card-create-node">
        <ActionCard v-bind="item.info" :operations="[]" :affordable="true" />
      </div>
    </TransitionGroup>
    <TransitionGroup name="hand-card" tag="div" class="hand-track">
      <div
        v-for="(entry, index) in handEntries"
        :key="entry.key"
        class="hand-card-wrapper"
        :class="[
          cardWrapperClasses(index),
          isCardHidden(entry) ? 'hand-card-wrapper--hidden' : '',
          isCardRecentlyCreated(entry) ? 'hand-card-wrapper--recent' : '',
          selectionWrapperClass(entry),
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
        <div
          v-if="handSelectionRequest && !isHandSelectionCandidate(entry)"
          class="hand-card-blocked-reason"
        >
          {{ handSelectionBlockedReason(entry) ?? '選択不可' }}
        </div>
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
        <ActionCard
          v-bind="ghost.info"
          :operations="ghost.operations"
          :affordable="ghost.affordable"
          :disabled="true"
          variant="frame"
        />
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
  bottom: 10px;
  color: rgba(240, 235, 250, 0.9);
  font-size: 12px;
  letter-spacing: 0.05em;
  z-index: 4;
}

.hand-selection-banner {
  align-self: center;
  margin-bottom: 12px;
  padding: 8px 18px;
  border-radius: 12px;
  background: rgba(24, 16, 30, 0.92);
  color: #ffeae3;
  font-size: 13px;
  letter-spacing: 0.08em;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
}

.hand-selection-banner-enter-active,
.hand-selection-banner-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.hand-selection-banner-enter-from,
.hand-selection-banner-leave-to {
  opacity: 0;
  transform: translateY(-6px);
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
  --card-width: 140px;
  --card-overlap: 48px;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-end;
  gap: 0;
  min-height: 170px;
  margin-top: -10px;
}

.card-create-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -55%);
  display: flex;
  gap: 16px;
  pointer-events: none;
  z-index: 6;
}

.card-create-node {
  position: relative;
}

.card-create-enter-from {
  opacity: 0;
  transform: scale(0.7);
  filter: blur(10px);
}

.card-create-enter-to {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

.card-create-enter-active {
  transition:
    opacity 1s cubic-bezier(0.16, 1, 0.3, 1),
    transform 1s cubic-bezier(0.16, 1, 0.3, 1),
    filter 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-create-enter-active .card-create-node::after {
  content: '';
  position: absolute;
  inset: -10%;
  border-radius: 20px;
  background: radial-gradient(closest-side, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0));
  filter: blur(18px);
  opacity: 0;
  animation: card-create-halo 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.card-create-leave-active {
  transition: opacity 200ms ease;
}

.card-create-leave-from {
  opacity: 1;
}

.card-create-leave-to {
  opacity: 0;
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

.hand-card-wrapper--recent::before,
.hand-card-wrapper--recent::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 16px;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.45), rgba(255, 248, 235, 0.1));
  opacity: 0;
  pointer-events: none;
}

.hand-card-wrapper--recent::before {
  animation: hand-card-wipe-forward 0.2s ease forwards;
}

.hand-card-wrapper--recent::after {
  animation: hand-card-wipe-backward 0.2s ease forwards;
}

.hand-card-wrapper--selection-candidate {
  z-index: 4;
  filter: drop-shadow(0 0 12px rgba(255, 191, 134, 0.45));
}

.hand-card-wrapper--selection-blocked {
  opacity: 0.4;
  pointer-events: none;
}

.hand-card-blocked-reason {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 6px;
  padding: 4px 8px;
  text-align: center;
  font-size: 11px;
  color: #ffd6de;
  background: rgba(24, 10, 16, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(255, 128, 158, 0.35);
  pointer-events: none;
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

@keyframes hand-card-wipe-forward {
  0% {
    opacity: 0;
    transform: translate(40%, -40%) rotate(14deg);
  }
  50% {
    opacity: 0.9;
    transform: translate(0, 0) rotate(14deg);
  }
  100% {
    opacity: 0;
    transform: translate(-40%, 40%) rotate(14deg);
  }
}

@keyframes hand-card-wipe-backward {
  0% {
    opacity: 0;
    transform: translate(-40%, 40%) rotate(-14deg);
  }
  50% {
    opacity: 0.9;
    transform: translate(0, 0) rotate(-14deg);
  }
  100% {
    opacity: 0;
    transform: translate(40%, -40%) rotate(-14deg);
  }
}

@keyframes card-create-halo {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  60% {
    opacity: 0.9;
    transform: scale(1.05);
  }
  100% {
    opacity: 0;
    transform: scale(1.3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-create-enter-active {
    transition-duration: 200ms;
  }
  .card-create-enter-active .card-create-node::after {
    animation-duration: 200ms;
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
  display: block;
  pointer-events: none;
  opacity: 0;
  transform: translate3d(0, 0, 0);
  transition: transform 0.3s ease-out, opacity 0.25s ease-out;
  width: 94px;
  height: 140px;
}

.hand-floating-card--active {
  opacity: 1;
}

.hand-floating-card--trash,
.hand-floating-card--eliminate {
  opacity: 1;
}

.hand-floating-card--trash.hand-floating-card--active,
.hand-floating-card--eliminate.hand-floating-card--active {
  opacity: 0;
}

.hand-floating-card--eliminate::before,
.hand-floating-card--eliminate::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 12px;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.45), rgba(255, 210, 210, 0.1));
  opacity: 0;
  pointer-events: none;
}

.hand-floating-card--eliminate::before {
  animation: hand-card-wipe-forward 0.2s ease forwards;
}

.hand-floating-card--eliminate::after {
  animation: hand-card-wipe-backward 0.2s ease forwards;
}

.hand-floating-card :deep(.action-card) {
  width: 94px;
  height: 140px;
  pointer-events: none;
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
