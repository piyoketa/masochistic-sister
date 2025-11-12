import { ref, watch, nextTick, type ComputedRef, type Ref } from 'vue'
import type { StageEventPayload } from '@/types/animation'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { HandEntry } from './useHandPresentation'

interface PendingCreateRequest {
  batchId: string
  count: number
}

interface UseHandStageEventsOptions {
  stageEvent: () => StageEventPayload | null
  snapshot: () => BattleSnapshot | undefined
  cardTitleMap: ComputedRef<Map<number, string>>
  findHandEntryByCardId: (cardId: number) => HandEntry | undefined
  startDeckDrawAnimation: (cardId: number) => void
  startCardRemovalAnimation: (
    cardId: number,
    entry: HandEntry | undefined,
    variant: 'trash' | 'eliminate',
    options?: { fallbackTitle?: string },
  ) => void
  startCardCreateSequence: (entry: HandEntry) => void
  startCardCreateHighlight: (cardId: number) => void
}

export function useHandStageEvents(options: UseHandStageEventsOptions) {
  const handOverflowOverlayMessage = ref<string | null>(null)
  const pendingDrawCardIds = ref<Set<number>>(new Set())
  const pendingCreateQueue: PendingCreateRequest[] = []
  const previousHandIds = ref<Set<number>>(new Set())
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
        options.startDeckDrawAnimation(cardId)
        continue
      }
      if (pendingCreateQueue.length > 0) {
        const request = pendingCreateQueue[0]
        request.count -= 1
        const entry = options.findHandEntryByCardId(cardId)
        if (entry) {
          options.startCardCreateSequence(entry)
        } else {
          options.startCardCreateHighlight(cardId)
        }
        if (request.count <= 0) {
          pendingCreateQueue.shift()
        }
      }
    }
  }

  function handleDeckDrawStage(event: StageEventPayload): void {
    const cardIds = extractCardIds(event.metadata)
    cardIds.forEach((id) => addToSet(pendingDrawCardIds, id))
    if (event.metadata?.handOverflow) {
      showHandOverflowOverlay()
    }
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

  function handleCardCreateStage(event: StageEventPayload): void {
    const count =
      (Array.isArray(event.metadata?.cards) ? event.metadata.cards.length : undefined) ??
      (Array.isArray(event.metadata?.cardIds) ? event.metadata.cardIds.length : undefined) ??
      0
    if (count > 0) {
      pendingCreateQueue.push({ batchId: event.batchId, count })
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

  function dispose(): void {
    if (handOverflowTimer) {
      window.clearTimeout(handOverflowTimer)
      handOverflowTimer = null
    }
    pendingDrawCardIds.value = new Set()
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
