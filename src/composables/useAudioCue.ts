/**
 * useAudioCue
 * ============
 * 敵撃破やカード使用など短尺効果音を再生するためのシンプルなComposable。
 * - soundId（例: `skills/kurage-kosho_teleport01.mp3`）を `/sounds/**` 配下の実ファイルにマッピング
 * - Audio要素をキャッシュしつつ、再生毎にcloneして同時再生にも対応
 * - SSR / テスト実行時など `window` が存在しない環境では黙って何もしない
 */
import { ref } from 'vue'

const audioCache = new Map<string, HTMLAudioElement>()
const activeSources = ref<Set<HTMLAudioElement>>(new Set())

export interface PlayAudioCueOptions {
  volume?: number
  playbackRate?: number
  loop?: boolean
  /**
   * 再生開始位置（ミリ秒）。ショートSEの頭出し調整用。
   */
  startTimeMs?: number
}

export function useAudioCue() {
  function play(soundId: string | undefined, options?: PlayAudioCueOptions): void {
    if (!soundId) {
      return
    }
    const blueprint = ensureAudioElement(soundId)
    if (!blueprint) {
      return
    }
    const source = blueprint.cloneNode(true) as HTMLAudioElement
    applyOptions(source, options)

    activeSources.value.add(source)
    const cleanup = () => {
      source.pause()
      activeSources.value.delete(source)
    }
    source.addEventListener('ended', cleanup, { once: true })
    source.addEventListener(
      'error',
      () => activeSources.value.delete(source),
      { once: true },
    )
    const playPromise = source.play()
    if (playPromise?.catch) {
      playPromise.catch((error) => {
        if (import.meta.env.DEV) {
          console.warn('[useAudioCue] Failed to play audio', soundId, error)
        }
        activeSources.value.delete(source)
      })
    }
  }

  function preload(soundId: string | undefined): void {
    if (!soundId) {
      return
    }
    ensureAudioElement(soundId)
  }

  function stopAll(): void {
    activeSources.value.forEach((source) => {
      source.pause()
      source.currentTime = 0
    })
    activeSources.value.clear()
  }

  return { play, preload, stopAll }
}

function normalizeSoundPath(soundId: string): string {
  // Vite の base パス（例: GitHub Pages のサブディレクトリ配信）でも動くよう、常に BASE_URL を起点にする。
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const normalizeBase = base.endsWith('/') ? base.slice(0, -1) : base
  if (/^https?:\/\//i.test(soundId)) {
    return soundId
  }
  if (soundId.startsWith('/')) {
    return `${normalizeBase}${soundId}`
  }
  const relativePath = soundId.startsWith('sounds/')
    ? soundId
    : `sounds/${soundId.replace(/^\/+/, '')}`
  return `${normalizeBase}/${relativePath}`
}

function ensureAudioElement(soundId: string): HTMLAudioElement | null {
  if (typeof window === 'undefined') {
    return null
  }
  const path = normalizeSoundPath(soundId)
  let element = audioCache.get(path)
  if (!element) {
    element = new Audio(path)
    element.preload = 'auto'
    audioCache.set(path, element)
  }
  return element
}

function applyOptions(source: HTMLAudioElement, options?: PlayAudioCueOptions): void {
  if (!options) {
    return
  }
  if (options.volume !== undefined) {
    source.volume = Math.min(1, Math.max(0, options.volume))
  }
  if (options.playbackRate !== undefined) {
    source.playbackRate = Math.max(0.5, Math.min(4, options.playbackRate))
  }
  source.loop = Boolean(options.loop)
  if (options.startTimeMs !== undefined) {
    source.currentTime = Math.max(0, options.startTimeMs / 1000)
  }
}
