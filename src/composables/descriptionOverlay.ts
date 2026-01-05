import { reactive } from 'vue'

interface OverlayPosition {
  x: number
  y: number
}

interface DescriptionOverlayState extends OverlayPosition {
  visible: boolean
  text: string
  pinned: boolean
  /** 先頭行をタイトルとして強調表示するかどうか */
  emphasizeFirstLine: boolean
}

const overlayState = reactive<DescriptionOverlayState>({
  visible: false,
  text: '',
  x: 0,
  y: 0,
  pinned: false,
  emphasizeFirstLine: false,
})

export function useDescriptionOverlay() {
  const show = (
    text: string,
    position: OverlayPosition,
    options?: {
      emphasizeFirstLine?: boolean
    },
  ) => {
    // emphasizeFirstLine は表示時にのみ指定し、非指定の場合は強調を無効化する
    overlayState.text = text
    overlayState.x = position.x
    overlayState.y = position.y
    overlayState.visible = true
    overlayState.pinned = false
    overlayState.emphasizeFirstLine = Boolean(options?.emphasizeFirstLine)
  }

  const pin = (
    text: string,
    position: OverlayPosition,
    options?: {
      emphasizeFirstLine?: boolean
    },
  ) => {
    // ツールチップを固定表示するための専用API。hover解除でも消えない。
    overlayState.text = text
    overlayState.x = position.x
    overlayState.y = position.y
    overlayState.visible = true
    overlayState.pinned = true
    overlayState.emphasizeFirstLine = Boolean(options?.emphasizeFirstLine)
  }

  const hide = (force = false) => {
    if (overlayState.pinned && !force) {
      return
    }
    overlayState.visible = false
    overlayState.text = ''
    overlayState.pinned = false
    overlayState.emphasizeFirstLine = false
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
