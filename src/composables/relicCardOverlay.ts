import { reactive } from 'vue'
import type { RelicInfo } from '@/domain/entities/relics/relicLibrary'
import { getRelicInfoByClassName } from '@/domain/library/Library'

interface OverlayPosition {
  x: number
  y: number
}

interface RelicCardOverlayState extends OverlayPosition {
  visible: boolean
  relic: RelicInfo | null
  relicClassName: string | null
}

const overlayState = reactive<RelicCardOverlayState>({
  visible: false,
  relic: null,
  relicClassName: null,
  x: 0,
  y: 0,
})

export function useRelicCardOverlay() {
  const show = (relic: RelicInfo, position: OverlayPosition) => {
    overlayState.relic = relic
    overlayState.relicClassName = relic.className
    overlayState.x = position.x
    overlayState.y = position.y
    overlayState.visible = true
  }

  const showByClassName = (className: string, position: OverlayPosition) => {
    const relic = getRelicInfoByClassName(className)
    overlayState.relicClassName = className
    overlayState.relic = relic
    overlayState.x = position.x
    overlayState.y = position.y
    overlayState.visible = true
  }

  const hide = () => {
    overlayState.visible = false
    overlayState.relic = null
    overlayState.relicClassName = null
  }

  const updatePosition = (position: OverlayPosition) => {
    overlayState.x = position.x
    overlayState.y = position.y
  }

  return {
    state: overlayState,
    show,
    showByClassName,
    hide,
    updatePosition,
  }
}
