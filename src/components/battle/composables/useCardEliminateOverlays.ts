/**
 * useCardEliminateOverlays の責務:
 * - card-eliminate 演出のための一時的なオーバーレイを管理し、ActionCard の見た目を維持したまま砂化アニメーションを描画する。
 * - spawn / cleanup 処理と粒子エフェクト呼び出しをカプセル化し、useHandAnimations からは簡潔な API で利用できるようにする。
 *
 * 責務ではないこと:
 * - 手札配列の更新や StageEvent の監視。これは useHandAnimations / useHandStageEvents が担当する。
 */
import { reactive } from 'vue'
import type { CardInfo } from '@/types/battle'
import { spawnCardAshOverlay } from '@/utils/cardAshOverlay'

const FALLBACK_WIDTH = 120
const FALLBACK_HEIGHT = 170
const CLEANUP_BUFFER_MS = 120

export interface CardEliminateOverlay {
  id: string
  info: CardInfo
  operations: string[]
  affordable: boolean
  style: Record<string, string>
  active: boolean
}

interface SpawnOverlayParams {
  entry: {
    info: CardInfo
    operations: string[]
    affordable: boolean
  }
  rect: DOMRect
  duration: number
  particleColor: string
  animationPreset: {
    motionScale: number
    durationScale: number
    horizontalSpreadScale: number
    initialXRange: { min: number; max: number }
  }
}

export function useCardEliminateOverlays() {
  const overlays = reactive<CardEliminateOverlay[]>([])

  function spawnOverlay(params: SpawnOverlayParams): void {
    const overlay: CardEliminateOverlay = reactive({
      id: `card-eliminate-overlay-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      info: params.entry.info,
      operations: params.entry.operations,
      affordable: params.entry.affordable ?? true,
      style: {
        left: `${params.rect.left}px`,
        top: `${params.rect.top}px`,
        width: `${params.rect.width || FALLBACK_WIDTH}px`,
        height: `${params.rect.height || FALLBACK_HEIGHT}px`,
      },
      active: false,
    })
    overlays.push(overlay)

    spawnCardAshOverlay(params.rect, {
      ...params.animationPreset,
      particleColor: params.particleColor,
    })

    requestAnimationFrame(() => {
      overlay.active = true
    })

    const totalDuration = params.duration + CLEANUP_BUFFER_MS
    window.setTimeout(() => removeOverlay(overlay), totalDuration)
  }

  function removeOverlay(target: CardEliminateOverlay): void {
    const index = overlays.indexOf(target)
    if (index >= 0) {
      overlays.splice(index, 1)
    }
  }

  return {
    overlays,
    spawnOverlay,
  }
}
