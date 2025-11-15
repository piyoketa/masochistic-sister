/**
 * cardAshOverlay.ts の責務:
 * - 砂化演出用の前面パーティクルオーバーレイを生成し、アニメーション完了後に破棄する。
 *
 * 責務ではないこと:
 * - カード本体のマスク制御や手札 DOM の状態管理。
 */

const DEFAULT_PARTICLE_COUNT = 72
const DEFAULT_DURATION_MS = 1000
const CLEANUP_BUFFER_MS = 150
const FALLBACK_CARD_WIDTH = 94
const FALLBACK_CARD_HEIGHT = 140

export type CardAshOverlayOptions = {
  particleCount?: number
  particleColor?: string
  durationScale?: number
  motionScale?: number
  horizontalSpreadScale?: number
  initialXRange?: { min: number; max: number }
}

export function spawnCardAshOverlay(bounds: DOMRect, options: CardAshOverlayOptions = {}): () => void {
  if (typeof document === 'undefined') {
    return () => {}
  }

  const overlay = document.createElement('div')
  overlay.className = 'card-ash-overlay'
  overlay.style.left = `${bounds.left}px`
  overlay.style.top = `${bounds.top}px`
  overlay.style.width = `${bounds.width || FALLBACK_CARD_WIDTH}px`
  overlay.style.height = `${bounds.height || FALLBACK_CARD_HEIGHT}px`
  document.body.appendChild(overlay)

  const width = bounds.width || FALLBACK_CARD_WIDTH
  const height = bounds.height || FALLBACK_CARD_HEIGHT
  const fragment = document.createDocumentFragment()
  const particleCount = options.particleCount ?? DEFAULT_PARTICLE_COUNT
  const durationScale = clamp(options.durationScale ?? 1, 0.05, 5)
  const motionScale = clamp(options.motionScale ?? 1, 0.05, 5)
  const horizontalScale = clamp(options.horizontalSpreadScale ?? motionScale, 0.05, 5)
  const xRange = normalizeRange(options.initialXRange ?? { min: 0.05, max: 0.95 })
  const particleColor = options.particleColor ?? 'rgba(235, 235, 235, 0.9)'
  let maxDelay = 0
  let maxDuration = 0

  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement('i')
    particle.className = 'card-ash-particle'

    const x = (Math.random() * (xRange.max - xRange.min) + xRange.min) * width
    const y = (Math.random() * 0.55 + 0.4) * height
    const dx = (Math.random() * 120 - 60) * horizontalScale
    const dy = -(Math.random() * 110 + 50) * motionScale
    const size = (Math.random() * 3.5 + 2).toFixed(2) + 'px'
    const delay = Math.round(Math.random() * 220 * durationScale)
    const duration = Math.round((900 + Math.random() * 400) * durationScale)

    maxDelay = Math.max(maxDelay, delay)
    maxDuration = Math.max(maxDuration, duration)

    particle.style.setProperty('--p-x', `${x.toFixed(2)}px`)
    particle.style.setProperty('--p-y', `${y.toFixed(2)}px`)
    particle.style.setProperty('--p-dx', `${dx.toFixed(2)}px`)
    particle.style.setProperty('--p-dy', `${dy.toFixed(2)}px`)
    particle.style.setProperty('--p-size', size)
    particle.style.setProperty('--p-delay', `${delay}ms`)
    particle.style.setProperty('--p-dur', `${duration}ms`)
    particle.style.background = particleColor
    particle.style.boxShadow = `0 0 0 1px ${particleColor}`
    fragment.appendChild(particle)
  }

  overlay.appendChild(fragment)

  const totalLifetime = maxDelay + maxDuration + CLEANUP_BUFFER_MS
  const cleanupTimer = window.setTimeout(() => {
    overlay.remove()
  }, totalLifetime)

  return () => {
    window.clearTimeout(cleanupTimer)
    overlay.remove()
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function normalizeRange(range: { min: number; max: number }): { min: number; max: number } {
  const minValue = Number.isFinite(range.min) ? range.min : 0.05
  const maxValue = Number.isFinite(range.max) ? range.max : 0.95
  if (minValue === maxValue) {
    return { min: minValue, max: minValue }
  }
  return {
    min: Math.max(0, Math.min(minValue, maxValue)),
    max: Math.min(1, Math.max(minValue, maxValue)),
  }
}
