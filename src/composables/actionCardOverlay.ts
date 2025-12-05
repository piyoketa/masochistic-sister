import { reactive } from 'vue'
import type { CardInfo } from '@/types/battle'
import type { DeckCardBlueprint } from '@/domain/library/Library'

interface OverlayPosition {
  x: number
  y: number
}

interface ActionCardOverlayState extends OverlayPosition {
  visible: boolean
  card: CardInfo | null
  blueprint: DeckCardBlueprint | null
}

const overlayState = reactive<ActionCardOverlayState>({
  visible: false,
  card: null,
  blueprint: null,
  x: 0,
  y: 0,
})

export function useActionCardOverlay() {
  const show = (card: CardInfo, position: OverlayPosition) => {
    overlayState.card = card
    overlayState.blueprint = null
    overlayState.x = position.x
    overlayState.y = position.y
    overlayState.visible = true
  }

  const showFromBlueprint = (blueprint: DeckCardBlueprint, position: OverlayPosition) => {
    overlayState.blueprint = blueprint
    overlayState.card = null
    overlayState.x = position.x
    overlayState.y = position.y
    overlayState.visible = true
  }

  const hide = () => {
    overlayState.visible = false
    overlayState.card = null
    overlayState.blueprint = null
  }

  const updatePosition = (position: OverlayPosition) => {
    overlayState.x = position.x
    overlayState.y = position.y
  }

  return {
    state: overlayState,
    show,
    showFromBlueprint,
    hide,
    updatePosition,
  }
}
