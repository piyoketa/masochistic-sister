import { ref, watch, nextTick, type ComputedRef, type Ref } from 'vue'
import type { StageEventPayload } from '@/types/animation'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { HandEntry } from './useHandPresentation'

interface PendingCreateRequest {
  batchId: string
  remainingCount: number
  cardIds: number[]
}

interface UseHandStageEventsOptions {
  stageEvent: () => StageEventPayload | null
  snapshot: () => BattleSnapshot | undefined
  cardTitleMap: ComputedRef<Map<number, string>>
  findHandEntryByCardId: (cardId: number) => HandEntry | undefined
  startDeckDrawAnimation: (cardId: number, options?: { durationMs?: number }) => void
  startCardCreateAnimation: (cardId: number) => void
  startCardRemovalAnimation: (
    cardId: number,
    entry: HandEntry | undefined,
    variant: 'trash' | 'eliminate',
    options?: { fallbackTitle?: string },
  ) => void
}

export function useHandStageEvents(options: UseHandStageEventsOptions) {
  const handOverflowOverlayMessage = ref<string | null>(null)
  const pendingDrawCardIds = ref<Set<number>>(new Set())
  const previousHandIds = ref<Set<number>>(new Set())
  const pendingDrawAnimationOptions = new Map<number, { durationMs?: number; delayMs?: number }>()
  const pendingCreateQueue: PendingCreateRequest[] = []
  const snapshotCreateQueue = () =>
    pendingCreateQueue.map((request) => ({
      batchId: request.batchId,
      remainingCount: request.remainingCount,
      cardIds: [...request.cardIds],
    }))
  const processedStageBatchIds = new Set<string>()
  let handOverflowTimer: ReturnType<typeof window.setTimeout> | null = null

  watch(
    () => options.stageEvent(),
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

  watch(
    () =>
      options
        .snapshot()
        ?.hand.map((card) => card.id)
        .filter((id): id is number => typeof id === 'number'),
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
        const animationOptions = pendingDrawAnimationOptions.get(cardId)
        pendingDrawAnimationOptions.delete(cardId)
        options.startDeckDrawAnimation(cardId, animationOptions)
        continue
      }
      if (pendingCreateQueue.length > 0) {
        logCardCreateDebug('Snapshot検知: card-create 対象カードを割り当て', {
          cardId,
          snapshot: snapshotCreateQueue(),
        })
        assignCardToCreateQueue(cardId)
        continue
      }
    }
  }

  function handleDeckDrawStage(event: StageEventPayload): void {
    const cardIds = extractCardIds(event.metadata)
    const durationMs = extractDurationMs(event.metadata)
    cardIds.forEach((id, index) => {
      addToSet(pendingDrawCardIds, id)
      const delayMs = index * DRAW_STAGGER_DELAY_MS
      pendingDrawAnimationOptions.set(id, { durationMs, delayMs })
    })
    if (event.metadata?.handOverflow) {
      showHandOverflowOverlay()
    }
  }

  function handleCardCreateStage(event: StageEventPayload): void {
    const cardIds = extractCardIds(event.metadata)
    const declaredCount = extractCardCreateCount(event.metadata)
    const remainingCount = Math.max(cardIds.length, declaredCount)
    if (remainingCount <= 0) {
      return
    }
    pendingCreateQueue.push({
      batchId: event.batchId,
      remainingCount,
      cardIds: [...cardIds],
    })
    logCardCreateDebug('stage event 受信: card-create を待機キューへ追加', {
      batchId: event.batchId,
      cardIds,
      declaredCount,
      snapshot: snapshotCreateQueue(),
    })
  }

  function assignCardToCreateQueue(cardId: number): void {
    for (const request of pendingCreateQueue) {
      const index = request.cardIds.indexOf(cardId)
      if (index !== -1) {
        request.cardIds.splice(index, 1)
        triggerCardCreateAnimation(request, cardId)
        if (request.remainingCount <= 0) {
          const requestIndex = pendingCreateQueue.indexOf(request)
          if (requestIndex >= 0) {
            pendingCreateQueue.splice(requestIndex, 1)
          }
        }
        return
      }
    }
    while (pendingCreateQueue.length > 0) {
      const current = pendingCreateQueue[0]
      if (current.remainingCount <= 0) {
        pendingCreateQueue.shift()
        continue
      }
      triggerCardCreateAnimation(current, cardId)
      if (current.remainingCount <= 0) {
        pendingCreateQueue.shift()
      }
      return
    }
    console.error('[BattleHandArea][card-create] 対応する生成キューが見つからずアニメーションに失敗しました', {
      cardId,
      snapshot: snapshotCreateQueue(),
    })
  }

  function triggerCardCreateAnimation(request: PendingCreateRequest, cardId: number): void {
    request.remainingCount = Math.max(0, request.remainingCount - 1)
    logCardCreateDebug('card-create アニメーション開始', {
      cardId,
      batchId: request.batchId,
      remainingCount: request.remainingCount,
    })
    options.startCardCreateAnimation(cardId)
  }

  function handleCardTrashStage(event: StageEventPayload): void {
    const cardIds = extractCardIds(event.metadata)
    const titles = (event.metadata?.cardTitles as string[] | undefined) ?? []
    cardIds.forEach((id, index) => {
      const fallbackTitle = titles[index] ?? options.cardTitleMap.value.get(id) ?? 'カード'
      const entry = options.findHandEntryByCardId(id)
      options.startCardRemovalAnimation(id, entry, 'trash', { fallbackTitle })
    })
  }

  function handleCardEliminateStage(event: StageEventPayload): void {
    const cardIds = extractCardIds(event.metadata)
    const titles = (event.metadata?.cardTitles as string[] | undefined) ?? []
    cardIds.forEach((id, index) => {
      const fallbackTitle = titles[index] ?? options.cardTitleMap.value.get(id) ?? 'カード'
      const entry = options.findHandEntryByCardId(id)
      options.startCardRemovalAnimation(id, entry, 'eliminate', { fallbackTitle })
    })
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

  function dispose(): void {
    if (handOverflowTimer) {
      window.clearTimeout(handOverflowTimer)
      handOverflowTimer = null
    }
    pendingDrawCardIds.value = new Set()
    pendingDrawAnimationOptions.clear()
    pendingCreateQueue.length = 0
  }

  return {
    handOverflowOverlayMessage,
    dispose,
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

function extractDurationMs(metadata: StageEventPayload['metadata']): number | undefined {
  if (!metadata) {
    return undefined
  }
  const durationCandidate = metadata.durationMs ?? metadata.animationDurationMs
  return typeof durationCandidate === 'number' && durationCandidate > 0 ? durationCandidate : undefined
}

const DRAW_STAGGER_DELAY_MS = 100

function extractCardCreateCount(metadata: StageEventPayload['metadata']): number {
  if (!metadata) {
    return 0
  }
  if (typeof metadata.cardCount === 'number') {
    return metadata.cardCount
  }
  if (Array.isArray(metadata.cardIds)) {
    return metadata.cardIds.length
  }
  if (Array.isArray((metadata as { cardTitles?: unknown }).cardTitles)) {
    return (metadata as { cardTitles?: unknown[] }).cardTitles?.length ?? 0
  }
  if (Array.isArray(metadata.cards)) {
    return metadata.cards.length
  }
  return 1
}

function addToSet(target: Ref<Set<number>>, value: number): void {
  const current = target.value
  if (current.has(value)) {
    return
  }
  const clone = new Set(current)
  clone.add(value)
  target.value = clone
}

function removeFromSet(target: Ref<Set<number>>, value: number): void {
  const current = target.value
  if (!current.has(value)) {
    return
  }
  const clone = new Set(current)
  clone.delete(value)
  target.value = clone
}
function snapshotCreateQueue(queue: PendingCreateRequest[] = pendingCreateQueue): Array<{
  batchId: string
  remainingCount: number
  cardIds: number[]
}> {
  return queue.map((request) => ({
    batchId: request.batchId,
    remainingCount: request.remainingCount,
    cardIds: [...request.cardIds],
  }))
}

function logCardCreateDebug(message: string, payload?: Record<string, unknown>): void {
  if (typeof console === 'undefined') {
    return
  }
  let serialized: unknown = ''
  if (payload) {
    try {
      serialized = JSON.parse(JSON.stringify(payload))
    } catch {
      serialized = payload
    }
  }
  console.info(`[BattleHandArea][card-create] ${message}`, serialized)
}
