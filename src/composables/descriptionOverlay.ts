import { reactive } from 'vue'

interface OverlayPosition {
  x: number
  y: number
}

interface DescriptionOverlayState extends OverlayPosition {
  visible: boolean
  text: string
}

const overlayState = reactive<DescriptionOverlayState>({
  visible: false,
  text: '',
  x: 0,
  y: 0,
})

export function useDescriptionOverlay() {
  const show = (text: string, position: OverlayPosition) => {
    overlayState.text = text
    overlayState.x = position.x
    overlayState.y = position.y
    overlayState.visible = true
  }

  const hide = () => {
    overlayState.visible = false
    overlayState.text = ''
  }

  const updatePosition = (position: OverlayPosition) => {
    overlayState.x = position.x
    overlayState.y = position.y
  }

  return {
    state: overlayState,
    show,
    hide,
    updatePosition,
  }
}
