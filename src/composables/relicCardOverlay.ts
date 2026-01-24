import { reactive } from 'vue'
import type { RelicDescriptionContext } from '@/domain/entities/relics/Relic'
import type { RelicInfo } from '@/domain/entities/relics/relicLibrary'
import type { RelicId } from '@/domain/entities/relics/relicTypes'
import { getRelicInfoById } from '@/domain/library/Library'

interface OverlayPosition {
  x: number
  y: number
}

interface RelicCardOverlayState extends OverlayPosition {
  visible: boolean
  relic: RelicInfo | null
  relicId: RelicId | null
}

const overlayState = reactive<RelicCardOverlayState>({
  visible: false,
  relic: null,
  relicId: null,
  x: 0,
  y: 0,
})

export function useRelicCardOverlay() {
  const show = (relic: RelicInfo, position: OverlayPosition) => {
    overlayState.relic = relic
    overlayState.relicId = relic.id
    overlayState.x = position.x
    overlayState.y = position.y
    overlayState.visible = true
  }

  const showByRelicId = (relicId: RelicId, position: OverlayPosition, context?: RelicDescriptionContext) => {
    const relic = getRelicInfoById(relicId, context)
    overlayState.relicId = relicId
    overlayState.relic = relic
    overlayState.x = position.x
    overlayState.y = position.y
    overlayState.visible = true
  }

  const hide = () => {
    overlayState.visible = false
    overlayState.relic = null
    overlayState.relicId = null
  }

  const updatePosition = (position: OverlayPosition) => {
    overlayState.x = position.x
    overlayState.y = position.y
  }

  return {
    state: overlayState,
    show,
    showByRelicId,
    hide,
    updatePosition,
  }
}
