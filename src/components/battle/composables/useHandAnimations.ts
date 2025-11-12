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

interface UseHandAnimationsOptions {
  handZoneRef: Ref<HTMLElement | null>
  deckCounterRef: Ref<HTMLElement | null>
  discardCounterRef: Ref<HTMLElement | null>
  findHandEntryByCardId: (cardId: number) => HandEntry | undefined
}

const ACTION_CARD_WIDTH = 94
const ACTION_CARD_HEIGHT = 140
const DRAW_ANIMATION_FALLBACK_MS = 600
const DRAW_ANIMATION_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)'
const DRAW_ANIMATION_CLEANUP_BUFFER_MS = 100

export function useHandAnimations(options: UseHandAnimationsOptions) {
  const hiddenCardIds = ref<Set<number>>(new Set())
  const visibleCardIds = ref<Set<number>>(new Set())
  const floatingCards = reactive<FloatingCardAnimation[]>([])
  const pendingRemovalTimers = new Map<number, ReturnType<typeof window.setTimeout>>()
  const cardElementRefs = new Map<number, HTMLElement>()
  const drawAnimationCleanupTimers = new Map<number, ReturnType<typeof window.setTimeout>>()
  const drawAnimationStartTimers = new Map<number, ReturnType<typeof window.setTimeout>>()

  function ensureVisibleCardId(cardId: number | undefined): void {
    if (cardId === undefined || hiddenCardIds.value.has(cardId) || visibleCardIds.value.has(cardId)) {
      return
    }
    const nextVisible = new Set(visibleCardIds.value)
    nextVisible.add(cardId)
    visibleCardIds.value = nextVisible
  }

  function hideCard(cardId?: number): void {
    if (cardId === undefined) {
      return
    }
    const nextHidden = new Set(hiddenCardIds.value)
    const nextVisible = new Set(visibleCardIds.value)
    nextHidden.add(cardId)
    nextVisible.delete(cardId)
    hiddenCardIds.value = nextHidden
    visibleCardIds.value = nextVisible
  }

  function showCard(cardId?: number): void {
    if (cardId === undefined) {
      return
    }
    const nextHidden = new Set(hiddenCardIds.value)
    const nextVisible = new Set(visibleCardIds.value)
    nextHidden.delete(cardId)
    nextVisible.add(cardId)
    hiddenCardIds.value = nextHidden
    visibleCardIds.value = nextVisible
  }

  function startDeckDrawAnimation(cardId: number, config?: { durationMs?: number; delayMs?: number }): void {
    const cardElement = cardElementRefs.get(cardId)
    const deckElement = options.deckCounterRef.value
    if (!cardElement || !deckElement) {
      console.error('[BattleHandArea][deck-draw] 必要なDOM要素を取得できずアニメーションを省略しました', {
        cardId,
        hasCardElement: Boolean(cardElement),
        hasDeckElement: Boolean(deckElement),
      })
      return
    }
    const duration = normalizeDuration(config?.durationMs)
    const delayMs = Math.max(0, config?.delayMs ?? 0)
    cleanupDrawAnimation(cardId)
    if (delayMs > 0) {
      prepareCardForDelayedAnimation(cardElement)
    }

    const startAnimation = () => {
      drawAnimationStartTimers.delete(cardId)
      applyDrawTransform(cardElement, deckElement, duration)
      const cleanupTimer = window.setTimeout(() => {
        cleanupDrawAnimation(cardId)
      }, duration + DRAW_ANIMATION_CLEANUP_BUFFER_MS)
      drawAnimationCleanupTimers.set(cardId, cleanupTimer)
    }

    if (delayMs > 0) {
      const startTimer = window.setTimeout(startAnimation, delayMs)
      drawAnimationStartTimers.set(cardId, startTimer)
    } else {
      startAnimation()
    }
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
      ensureVisibleCardId(cardId)
    } else {
      cleanupDrawAnimation(cardId)
      const previous = cardElementRefs.get(cardId)
      if (previous) {
        cleanupInlineAnimation(previous)
      }
      cardElementRefs.delete(cardId)
    }
  }

  function isCardHidden(entry: HandEntry): boolean {
    return entry.id !== undefined && hiddenCardIds.value.has(entry.id)
  }

  function isCardVisible(entry: HandEntry): boolean {
    return entry.id === undefined || visibleCardIds.value.has(entry.id)
  }

  function markCardsVisible(cardIds: number[]): void {
    const nextVisible = new Set(visibleCardIds.value)
    const nextHidden = new Set(hiddenCardIds.value)
    for (const id of cardIds) {
      nextHidden.delete(id)
      nextVisible.add(id)
    }
    visibleCardIds.value = nextVisible
    hiddenCardIds.value = nextHidden
  }

  function cleanup(): void {
    pendingRemovalTimers.forEach((timer) => window.clearTimeout(timer))
    pendingRemovalTimers.clear()
    drawAnimationCleanupTimers.forEach((timer) => window.clearTimeout(timer))
    drawAnimationCleanupTimers.clear()
    drawAnimationStartTimers.forEach((timer) => window.clearTimeout(timer))
    drawAnimationStartTimers.clear()
    cardElementRefs.forEach((element) => cleanupInlineAnimation(element))
  }

  function cleanupDrawAnimation(cardId: number): void {
    const startTimer = drawAnimationStartTimers.get(cardId)
    if (startTimer) {
      window.clearTimeout(startTimer)
      drawAnimationStartTimers.delete(cardId)
    }
    const timer = drawAnimationCleanupTimers.get(cardId)
    if (timer) {
      window.clearTimeout(timer)
      drawAnimationCleanupTimers.delete(cardId)
    }
    const element = cardElementRefs.get(cardId)
    if (element) {
      cleanupInlineAnimation(element)
    }
  }

  return {
    floatingCards,
    isCardHidden,
    isCardVisible,
    registerCardElement,
    startDeckDrawAnimation,
    startCardRemovalAnimation,
    cleanup,
    visibleCardIds,
    markCardsVisible,
  }
}

function applyDrawTransform(cardElement: HTMLElement, deckElement: HTMLElement, duration: number): void {
  const deckRect = deckElement.getBoundingClientRect()
  const cardRect = cardElement.getBoundingClientRect()
  const deckWidth = deckRect.width || ACTION_CARD_WIDTH
  const deckHeight = deckRect.height || ACTION_CARD_HEIGHT
  const cardWidth = cardRect.width || ACTION_CARD_WIDTH
  const cardHeight = cardRect.height || ACTION_CARD_HEIGHT
  const deckCenterX = deckRect.left + deckWidth / 2
  const deckCenterY = deckRect.top + deckHeight / 2
  const cardCenterX = cardRect.left + cardWidth / 2
  const cardCenterY = cardRect.top + cardHeight / 2
  const deltaX = deckCenterX - cardCenterX
  const deltaY = deckCenterY - cardCenterY
  const scaleX = deckWidth / cardWidth
  const scaleY = deckHeight / cardHeight

  cardElement.style.transition = 'none'
  cardElement.style.transformOrigin = 'center center'
  cardElement.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`
  cardElement.style.opacity = '0'
  cardElement.style.willChange = 'transform, opacity'
  cardElement.style.zIndex = '5'

  requestAnimationFrame(() => {
    const opacityDuration = Math.round(duration * 0.55)
    cardElement.style.transition = [
      `transform ${duration}ms ${DRAW_ANIMATION_EASING}`,
      `opacity ${opacityDuration}ms cubic-bezier(0.3, 0.95, 0.45, 1)`,
    ].join(', ')
    cardElement.style.transform = 'translate3d(0, 0, 0) scale(1)'
    cardElement.style.opacity = '1'
  })
}

function cleanupInlineAnimation(element: HTMLElement): void {
  element.style.transition = ''
  element.style.transform = ''
  element.style.opacity = ''
  element.style.willChange = ''
  element.style.zIndex = ''
}

function prepareCardForDelayedAnimation(element: HTMLElement): void {
  element.style.transition = 'none'
  element.style.opacity = '0'
  element.style.willChange = 'opacity'
  element.style.zIndex = '4'
}

function normalizeDuration(duration?: number): number {
  if (typeof duration !== 'number' || Number.isNaN(duration) || duration <= 0) {
    return DRAW_ANIMATION_FALLBACK_MS
  }
  return duration
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
