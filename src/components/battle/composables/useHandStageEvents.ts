import { ref, watch, nextTick, type ComputedRef } from 'vue'
import type { StageEventPayload, StageEventMetadata } from '@/types/animation'
import type { BattleSnapshot } from '@/domain/battle/Battle'
import type { HandEntry } from './useHandPresentation'

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
  notifyError?: (message: string) => void
}

type DeckDrawStageMetadata = Extract<StageEventMetadata, { stage: 'deck-draw' }>
type CardTrashStageMetadata = Extract<StageEventMetadata, { stage: 'card-trash' }>
type CardEliminateStageMetadata = Extract<StageEventMetadata, { stage: 'card-eliminate' }>
type CreateStateCardStageMetadata = Extract<StageEventMetadata, { stage: 'create-state-card' }>
type MemoryCardStageMetadata = Extract<StageEventMetadata, { stage: 'memory-card' }>
type AudioStageMetadata = Extract<StageEventMetadata, { stage: 'audio' }>
type AlreadyActedStageMetadata = Extract<StageEventMetadata, { stage: 'already-acted-enemy' }>

const DRAW_STAGGER_DELAY_MS = 100
const ENABLE_HAND_STAGE_DEBUG =
  typeof import.meta !== 'undefined' ? import.meta.env.VITE_DEBUG_HAND_STAGE_EVENTS === 'true' : false

export function useHandStageEvents(options: UseHandStageEventsOptions) {
  const handOverflowOverlayMessage = ref<string | null>(null)
  const processedStageBatchIds = new Set<string>()
  const processedStageInstructionIds = new Set<string>()
  const previousHandIds = ref<Set<number>>(new Set())
  const pendingDeckAnimations = new Map<number, { durationMs?: number; delayMs?: number }>()
  const pendingCreateAnimations = new Map<number, { simple: boolean }>()
  let handOverflowTimer: number | null = null

  const handleStageEvent = (event: StageEventPayload | null) => {
    if (!event || !event.batchId) {
      return
    }
    const stageKey = buildStageKey(event, event.metadata)
    if (processedStageBatchIds.has(event.batchId) && processedStageInstructionIds.has(stageKey)) {
      return
    }
    processedStageInstructionIds.add(stageKey)
    processedStageBatchIds.add(event.batchId)
    if (processedStageBatchIds.size > 500) {
      processedStageBatchIds.clear()
      processedStageBatchIds.add(event.batchId)
    }
    if (processedStageInstructionIds.size > 1000) {
      processedStageInstructionIds.clear()
    }
    const metadata = event.metadata
    if (!metadata) {
      return
    }
    logHandStageDebug('StageEvent受信', {
      batchId: event.batchId,
      entryType: event.entryType,
      stage: metadata.stage,
      metadata,
    })
    switch (metadata.stage) {
      case 'deck-draw':
        void handleDeckDrawStage(metadata)
        break
      case 'card-trash':
        handleCardTrashStage(metadata)
        break
      case 'card-eliminate':
        handleCardEliminateStage(metadata)
        break
      case 'create-state-card':
        void handleCreateStateCardStage(metadata, true)
        break
      case 'memory-card':
        void handleCreateStateCardStage(metadata, false)
        break
      default:
        break
    }
  }

  watch(
    () => options.stageEvent(),
    (event) => handleStageEvent(event),
  )

  watch(
    () =>
      options
        .snapshot()
        ?.hand.map((card) => card.id)
        .filter((id): id is number => typeof id === 'number'),
    async (handIds = []) => {
      await nextTick()
      const prev = previousHandIds.value
      const current = new Set(handIds)
      const newlyAdded = handIds.filter((id) => !prev.has(id))
      if (newlyAdded.length > 0) {
        logHandStageDebug('snapshot手札差分', {
          newlyAdded,
          pendingDeck: [...pendingDeckAnimations.keys()],
          pendingCreate: [...pendingCreateAnimations.keys()],
        })
      }
      newlyAdded.forEach((cardId) => {
        const deckAnim = pendingDeckAnimations.get(cardId)
        if (deckAnim) {
          pendingDeckAnimations.delete(cardId)
          startDeckDrawAnimationWithCleanup(cardId, deckAnim)
        }
        const createAnim = pendingCreateAnimations.get(cardId)
        if (createAnim) {
          pendingCreateAnimations.delete(cardId)
          options.startCardCreateAnimation(cardId, { simple: createAnim.simple })
        }
      })
      previousHandIds.value = current
    },
    { immediate: true },
  )

  async function handleDeckDrawStage(metadata: DeckDrawStageMetadata): Promise<void> {
    if (metadata.handOverflow) {
      showHandOverflowOverlay()
    }

    const cardIds = metadata.cardIds ?? []
    if (cardIds.length === 0) {
      return
    }
    await nextTick()
    const durationMs = extractDurationMs(metadata)
    const currentHandIds = collectHandIds(options.snapshot())
    cardIds.forEach((id, index) => {
      const delayMs = index * DRAW_STAGGER_DELAY_MS
      const config = { durationMs, delayMs }
      if (currentHandIds.has(id)) {
        triggerDeckAnimation(id, config)
      } else {
        pendingDeckAnimations.set(id, config)
        logHandStageDebug('deck-draw pending', { cardId: id, config })
      }
    })
  }

  async function handleCreateStateCardStage(
    metadata: CreateStateCardStageMetadata | MemoryCardStageMetadata,
    simpleMode: boolean,
  ): Promise<void> {
    const cardIds = resolveCardIds(metadata)
    if (cardIds.length === 0) {
      return
    }
    await nextTick()
    const currentHandIds = collectHandIds(options.snapshot())
    cardIds.forEach((cardId) => {
      if (currentHandIds.has(cardId)) {
        triggerCreateAnimation(cardId, simpleMode)
      } else {
        pendingCreateAnimations.set(cardId, { simple: simpleMode })
        logHandStageDebug('card-create pending', { cardId, simpleMode })
      }
    })
  }

  function handleCardTrashStage(metadata: CardTrashStageMetadata): void {
    const cardIds = metadata.cardIds ?? []
    const titles = metadata.cardTitles ?? []
    cardIds.forEach((id, index) => {
      const fallbackTitle = titles[index] ?? options.cardTitleMap.value.get(id) ?? 'カード'
      const entry = options.findHandEntryByCardId(id)
      options.startCardRemovalAnimation(id, entry, 'trash', { fallbackTitle })
    })
  }

  function handleCardEliminateStage(metadata: CardEliminateStageMetadata): void {
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
    options.notifyError?.('手札が満杯です！')
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
  }

  return {
    handOverflowOverlayMessage,
    dispose,
  }

  function triggerDeckAnimation(cardId: number, config: { durationMs?: number; delayMs?: number }): void {
    void nextTick(() => {
      pendingDeckAnimations.delete(cardId)
      startDeckDrawAnimationWithCleanup(cardId, config)
      logHandStageDebug('deck-draw即時適用', { cardId, config })
    })
  }

  function triggerCreateAnimation(cardId: number, simpleMode: boolean): void {
    void nextTick(() => {
      pendingCreateAnimations.delete(cardId)
      options.startCardCreateAnimation(cardId, { simple: simpleMode })
      logHandStageDebug('card-create即時適用', { cardId, simpleMode })
    })
  }

  function startDeckDrawAnimationWithCleanup(
    cardId: number,
    config: { durationMs?: number; delayMs?: number },
  ): void {
    options.startDeckDrawAnimation(cardId, config)
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

function collectHandIds(snapshot?: BattleSnapshot): Set<number> {
  if (!snapshot) {
    return new Set()
  }
  const ids = snapshot.hand
    .map((card) => card.id)
    .filter((id): id is number => typeof id === 'number')
  return new Set(ids)
}

function logHandStageDebug(message: string, payload?: Record<string, unknown>): void {
  if (!ENABLE_HAND_STAGE_DEBUG || typeof console === 'undefined') {
    return
  }
  // eslint-disable-next-line no-console
  console.info(`[BattleHandArea][stage-events] ${message}`, payload ?? '')
}

function buildStageKey(event: StageEventPayload, metadata?: StageEventMetadata): string {
  const stage = metadata?.stage ?? 'unknown'
  return `${event.batchId}:${stage}:${event.issuedAt}`
}
