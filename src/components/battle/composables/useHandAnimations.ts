import { reactive, ref, type Ref } from 'vue'
import type { CardInfo } from '@/types/battle'
import type { HandEntry } from './useHandPresentation'

export interface FloatingCardAnimation {
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

interface CardCreateOverlay {
  key: string
  info: CardInfo
  id: number
}

interface UseHandAnimationsOptions {
  handZoneRef: Ref<HTMLElement | null>
  deckCounterRef: Ref<HTMLElement | null>
  discardCounterRef: Ref<HTMLElement | null>
  findHandEntryByCardId: (cardId: number) => HandEntry | undefined
}

const CARD_CREATE_DURATION_MS = 1000
const ACTION_CARD_WIDTH = 94
const ACTION_CARD_HEIGHT = 140

export function useHandAnimations(options: UseHandAnimationsOptions) {
  const hiddenCardIds = ref<Set<number>>(new Set())
  const recentCardIds = ref<Set<number>>(new Set())
  const floatingCards = reactive<FloatingCardAnimation[]>([])
  const cardCreateOverlays = ref<CardCreateOverlay[]>([])
  const cardCreateTimers = new Map<string, ReturnType<typeof window.setTimeout>>()
  const pendingRemovalTimers = new Map<number, ReturnType<typeof window.setTimeout>>()
  const deckDrawRetryCounters = new Map<number, number>()
  const cardElementRefs = new Map<number, HTMLElement>()

  function hideCard(cardId?: number): void {
    if (cardId === undefined) {
      return
    }
    const next = new Set(hiddenCardIds.value)
    next.add(cardId)
    hiddenCardIds.value = next
  }

  function showCard(cardId?: number): void {
    if (cardId === undefined) {
      return
    }
    const next = new Set(hiddenCardIds.value)
    next.delete(cardId)
    hiddenCardIds.value = next
  }

  function startDeckDrawAnimation(cardId: number, attempt = 0): void {
    const cardElement = cardElementRefs.get(cardId)
    const deckElement = options.deckCounterRef.value
    const zoneElement = options.handZoneRef.value
    const entry = options.findHandEntryByCardId(cardId)
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
    config: { fallbackTitle?: string } = {},
    attempt = 0,
  ): void {
    const cardElement = cardElementRefs.get(cardId)
    const zoneElement = options.handZoneRef.value
    const targetElement = variant === 'trash' ? options.discardCounterRef.value : options.handZoneRef.value
    if (!cardElement || !zoneElement || !targetElement) {
      if (attempt < 5) {
        const timer = window.setTimeout(
          () => startCardRemovalAnimation(cardId, entry, variant, config, attempt + 1),
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
      cardInfo: entry?.info ?? buildFallbackCardInfo(cardId, config.fallbackTitle ?? 'カード'),
      operations: entry?.operations ?? [],
      affordable: entry?.affordable ?? true,
      fromRect: sourceRect,
      toRect: targetRect,
      zoneRect,
      variant,
      onComplete: () => showCard(cardId),
    })
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
    const timer = cardCreateTimers.get(key)
    if (timer) {
      window.clearTimeout(timer)
      cardCreateTimers.delete(key)
    }
    cardCreateOverlays.value = cardCreateOverlays.value.filter((item) => item.key !== key)
    showCard(cardId)
    startCardCreateHighlight(cardId)
  }

  function startCardCreateHighlight(cardId: number): void {
    addToSet(recentCardIds, cardId)
    window.setTimeout(() => removeFromSet(recentCardIds, cardId), 550)
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

  function isCardHidden(entry: HandEntry): boolean {
    return entry.id !== undefined && hiddenCardIds.value.has(entry.id)
  }

  function isCardRecentlyCreated(entry: HandEntry): boolean {
    return entry.id !== undefined && recentCardIds.value.has(entry.id)
  }

  function cleanup(): void {
    cardCreateTimers.forEach((timer) => window.clearTimeout(timer))
    cardCreateTimers.clear()
    pendingRemovalTimers.forEach((timer) => window.clearTimeout(timer))
    pendingRemovalTimers.clear()
    deckDrawRetryCounters.clear()
  }

  return {
    floatingCards,
    cardCreateOverlays,
    isCardHidden,
    isCardRecentlyCreated,
    registerCardElement,
    startDeckDrawAnimation,
    startCardRemovalAnimation,
    startCardCreateSequence,
    startCardCreateHighlight,
    cleanup,
  }
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
