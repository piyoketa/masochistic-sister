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

export function spawnCardAshOverlay(bounds: DOMRect): () => void {
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
  let maxDelay = 0
  let maxDuration = 0

  for (let index = 0; index < DEFAULT_PARTICLE_COUNT; index += 1) {
    const particle = document.createElement('i')
    particle.className = 'card-ash-particle'

    const x = (Math.random() * 0.9 + 0.05) * width
    const y = (Math.random() * 0.55 + 0.4) * height
    const dx = Math.random() * 120 - 60
    const dy = -(Math.random() * 110 + 50)
    const size = (Math.random() * 3.5 + 2).toFixed(2) + 'px'
    const delay = Math.round(Math.random() * 220)
    const duration = Math.round(900 + Math.random() * 400)

    maxDelay = Math.max(maxDelay, delay)
    maxDuration = Math.max(maxDuration, duration)

    particle.style.setProperty('--p-x', `${x.toFixed(2)}px`)
    particle.style.setProperty('--p-y', `${y.toFixed(2)}px`)
    particle.style.setProperty('--p-dx', `${dx.toFixed(2)}px`)
    particle.style.setProperty('--p-dy', `${dy.toFixed(2)}px`)
    particle.style.setProperty('--p-size', size)
    particle.style.setProperty('--p-delay', `${delay}ms`)
    particle.style.setProperty('--p-dur', `${duration}ms`)
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
