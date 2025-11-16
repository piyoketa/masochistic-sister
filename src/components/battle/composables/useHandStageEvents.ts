import { ref, watch, nextTick, type ComputedRef, type Ref } from 'vue'
import type { StageEventPayload, StageEventMetadata } from '@/types/animation'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { HandEntry } from './useHandPresentation'

type PendingCreateRequest = {
  batchId: string
  remainingCount: number
  cardIds: number[]
  stage: 'create-state-card' | 'memory-card'
  useSimpleAnimation: boolean
}

interface UseHandStageEventsOptions {
  stageEvent: () => StageEventPayload | null
  snapshot: () => BattleSnapshot | undefined
  cardTitleMap: ComputedRef<Map<number, string>>
  findHandEntryByCardId: (cardId: number) => HandEntry | undefined
  startDeckDrawAnimation: (cardId: number, options?: { durationMs?: number }) => void
  startCardCreateAnimation: (cardId: number, options?: { simple?: boolean }) => void
  startCardRemovalAnimation: (
    cardId: number,
    entry: HandEntry | undefined,
    variant: 'trash' | 'eliminate',
    options?: { fallbackTitle?: string },
  ) => void
}

type DeckDrawStageMetadata = Extract<StageEventMetadata, { stage: 'deck-draw' }>
type CardTrashStageMetadata = Extract<StageEventMetadata, { stage: 'card-trash' }>
type CardEliminateStageMetadata = Extract<StageEventMetadata, { stage: 'card-eliminate' }>
type CreateStateCardStageMetadata = Extract<StageEventMetadata, { stage: 'create-state-card' }>
type MemoryCardStageMetadata = Extract<StageEventMetadata, { stage: 'memory-card' }>
type AudioStageMetadata = Extract<StageEventMetadata, { stage: 'audio' }>
type AlreadyActedStageMetadata = Extract<StageEventMetadata, { stage: 'already-acted-enemy' }>

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
  let handOverflowTimer: number | null = null

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
      const metadata = event.metadata
      if (!metadata) {
        return
      }
      switch (metadata.stage) {
        case 'deck-draw':
          handleDeckDrawStage(event, metadata)
          break
        case 'card-trash':
          handleCardTrashStage(event, metadata)
          break
        case 'card-eliminate':
          handleCardEliminateStage(event, metadata)
          break
        case 'create-state-card':
          handleCreateStateCardStage(event, metadata)
          break
        case 'memory-card':
          handleMemoryCardStage(event, metadata)
          break
        case 'audio':
          handleAudioStage(metadata)
          break
        case 'already-acted-enemy':
          handleAlreadyActedStage(metadata)
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
        logCardCreateDebug('Snapshot検知: card生成対象カードを割り当て', {
          cardId,
          snapshot: snapshotCreateQueue(),
        })
        assignCardToCreateQueue(cardId)
        continue
      }
    }
  }

  function handleDeckDrawStage(event: StageEventPayload, metadata: DeckDrawStageMetadata): void {
    const cardIds = metadata.cardIds ?? []
    const durationMs = extractDurationMs(metadata)
    cardIds.forEach((id, index) => {
      addToSet(pendingDrawCardIds, id)
      const delayMs = index * DRAW_STAGGER_DELAY_MS
      pendingDrawAnimationOptions.set(id, { durationMs, delayMs })
    })
    if (metadata.handOverflow) {
      showHandOverflowOverlay()
    }
  }

  function handleCreateStateCardStage(event: StageEventPayload, metadata: CreateStateCardStageMetadata): void {
    enqueueCreateAnimation(event, metadata, {
      stage: 'create-state-card',
      simpleMode: true,
    })
  }

  function handleMemoryCardStage(event: StageEventPayload, metadata: MemoryCardStageMetadata): void {
    enqueueCreateAnimation(event, metadata, {
      stage: 'memory-card',
      simpleMode: false,
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
      if (!current) {
        pendingCreateQueue.shift()
        continue
      }
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
      stage: request.stage,
      simple: request.useSimpleAnimation,
    })
    options.startCardCreateAnimation(cardId, {
      simple: request.useSimpleAnimation,
    })
  }
  function enqueueCreateAnimation(
    event: StageEventPayload,
    metadata: CardCountMetadata,
    options: { stage: 'create-state-card' | 'memory-card'; simpleMode: boolean },
  ): void {
    const cardIds = metadata.cardIds ?? resolveCardIds(metadata)
    const declaredCount = (metadata.cardCount ?? cardIds.length) || 1
    const remainingCount = Math.max(cardIds.length, declaredCount)
    if (remainingCount <= 0) {
      return
    }
    pendingCreateQueue.push({
      batchId: event.batchId,
      remainingCount,
      cardIds: [...cardIds],
      stage: options.stage,
      useSimpleAnimation: options.simpleMode,
    })
    logCardCreateDebug(`stage event 受信: ${options.stage} を待機キューへ追加`, {
      batchId: event.batchId,
      cardIds,
      declaredCount,
      snapshot: snapshotCreateQueue(),
    })
  }

  function handleAudioStage(_metadata: AudioStageMetadata): void {
    // 音声の再生は BattleView 側で完結するため、手札エリアでは実質処理なし
  }

  function handleAlreadyActedStage(_metadata: AlreadyActedStageMetadata): void {
    // 行動済み敵のハイライトも EnemyArea 側で表現するため、ここでは何もしない
  }

  function handleCardTrashStage(event: StageEventPayload, metadata: CardTrashStageMetadata): void {
    const cardIds = metadata.cardIds ?? []
    const titles = metadata.cardTitles ?? []
    cardIds.forEach((id, index) => {
      const fallbackTitle = titles[index] ?? options.cardTitleMap.value.get(id) ?? 'カード'
      const entry = options.findHandEntryByCardId(id)
      options.startCardRemovalAnimation(id, entry, 'trash', { fallbackTitle })
    })
  }

  function handleCardEliminateStage(event: StageEventPayload, metadata: CardEliminateStageMetadata): void {
    const cardIds = metadata.cardIds ?? []
    const titles = metadata.cardTitles ?? []
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

type DurationAwareMetadata = StageEventMetadata & { durationMs?: number; animationDurationMs?: number }

function extractDurationMs(metadata: DurationAwareMetadata | undefined): number | undefined {
  if (!metadata) {
    return undefined
  }
  const durationCandidate = metadata.durationMs ?? metadata.animationDurationMs
  return typeof durationCandidate === 'number' && durationCandidate > 0 ? durationCandidate : undefined
}

const DRAW_STAGGER_DELAY_MS = 100

type CardIdentifierMetadata = {
  cardIds?: number[]
  cardId?: number
}

function resolveCardIds(metadata: CardIdentifierMetadata): number[] {
  if (Array.isArray(metadata.cardIds) && metadata.cardIds.length > 0) {
    return [...metadata.cardIds]
  }
  if (typeof metadata.cardId === 'number') {
    return [metadata.cardId]
  }
  return []
}

type CardCountMetadata = StageEventMetadata & {
  cardCount?: number
  cardIds?: number[]
  cardTitles?: unknown[]
  cards?: unknown[]
}

function extractCardCreateCount(metadata: CardCountMetadata | undefined): number {
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
