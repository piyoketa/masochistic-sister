/**
 * ImageHub
 * ========
 * - HTMLImageElement を使って事前ロードし、キャッシュを返す。
 * - provide/inject で共有し、重複ロードを防ぐ。
 */
import { inject, provide, ref } from 'vue'
import { IMAGE_ASSETS } from '@/assets/preloadManifest'

export interface ImageHub {
  preloadAll(urls: readonly string[]): Promise<void>
  /** src を返し、必要なら内部キャッシュを作成する */
  get(url: string | undefined): string | undefined
  ready: Readonly<{ value: boolean }>
}

export const IMAGE_HUB_KEY = Symbol('image-hub')
let fallbackImageHub: ImageHub | null = null

const ENABLE_LOG =
  String(import.meta.env?.VITE_ASSET_PRELOAD_LOG ?? '').toLowerCase() === 'true' ||
  String(import.meta.env?.VITE_ASSET_PRELOAD_LOG ?? '') === '1'

function normalizePath(src: string): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  if (src.startsWith('/')) return `${normalizedBase}${src}`
  return `${normalizedBase}/${src}`
}

export function createImageHub(): ImageHub {
  const ready = ref(false)
  const cache = new Map<string, HTMLImageElement>()

  async function preload(url: string): Promise<HTMLImageElement> {
    const normalized = normalizePath(url)
    const existing = cache.get(normalized)
    if (existing) {
      return existing
    }
    const img = new Image()
    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img)
      img.onerror = (err) => reject(err)
    })
    img.src = normalized
    cache.set(normalized, img)
    return promise
  }

  async function preloadAll(urls: readonly string[]): Promise<void> {
    await Promise.all(urls.map((u) => preload(u)))
    ready.value = true
    if (ENABLE_LOG) {
      console.info('[ImageHub] preloaded', urls.length)
    }
  }

  function get(url: string | undefined): string | undefined {
    if (!url) return undefined
    const normalized = normalizePath(url)
    if (!cache.has(normalized)) {
      // 即時に Image を作成しキャッシュ、読み込みはブラウザに任せる
      const img = new Image()
      img.src = normalized
      cache.set(normalized, img)
    }
    return normalized
  }

  return { preloadAll, get, ready }
}

export function provideImageHub(hub: ImageHub): void {
  provide(IMAGE_HUB_KEY, hub)
}

export function useImageHub(): ImageHub {
  const hub = inject<ImageHub>(IMAGE_HUB_KEY)
  if (hub) return hub
  // バトル外でもエラーにならないよう、フォールバックの Hub を生成する
  if (!fallbackImageHub) {
    fallbackImageHub = createImageHub()
    void fallbackImageHub.preloadAll(IMAGE_ASSETS).catch(() => undefined)
  }
  return fallbackImageHub
}
