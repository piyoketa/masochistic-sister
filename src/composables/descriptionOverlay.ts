import { reactive } from 'vue'

interface OverlayPosition {
  x: number
  y: number
}

interface DescriptionOverlayState extends OverlayPosition {
  visible: boolean
  text: string
  pinned: boolean
}

const overlayState = reactive<DescriptionOverlayState>({
  visible: false,
  text: '',
  x: 0,
  y: 0,
  pinned: false,
})

export function useDescriptionOverlay() {
  const show = (text: string, position: OverlayPosition) => {
    overlayState.text = text
    overlayState.x = position.x
    overlayState.y = position.y
    overlayState.visible = true
    overlayState.pinned = false
  }

  const pin = (text: string, position: OverlayPosition) => {
    // ツールチップを固定表示するための専用API。hover解除でも消えない。
    overlayState.text = text
    overlayState.x = position.x
    overlayState.y = position.y
    overlayState.visible = true
    overlayState.pinned = true
  }

  const hide = (force = false) => {
    if (overlayState.pinned && !force) {
      return
    }
    overlayState.visible = false
    overlayState.text = ''
    overlayState.pinned = false
  }

  const updatePosition = (position: OverlayPosition) => {
    if (overlayState.pinned) {
      return
    }
    overlayState.x = position.x
    overlayState.y = position.y
  }

  return {
    state: overlayState,
    show,
    pin,
    unpin: () => hide(true),
    hide,
    updatePosition,
  }
}
