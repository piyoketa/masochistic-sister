/**
 * ImageHub
 * ========
 * - HTMLImageElement を使って事前ロードし、キャッシュを返す。
 * - provide/inject で共有し、重複ロードを防ぐ。
 */
import { inject, provide, ref } from 'vue'
import { IMAGE_ASSETS } from '@/assets/preloadManifest'

interface ImageEntry {
  img: HTMLImageElement
  loaded: boolean
  promise: Promise<void>
}

export interface ImageHub {
  preloadAll(urls: readonly string[]): Promise<void>
  /** 正規化済みの src を返し、必要なら内部キャッシュを作成する */
  getSrc(url: string | undefined): string | undefined
  /** キャッシュ済みの Image 要素を返す（未ロードの場合は即座に作成してキャッシュ） */
  getElement(url: string | undefined): HTMLImageElement | undefined
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
  const cache = new Map<string, ImageEntry>()

  function ensureEntry(url: string): ImageEntry {
    const normalized = normalizePath(url)
    const existing = cache.get(normalized)
    if (existing) return existing
    const img = new Image()
    const promise = new Promise<void>((resolve, reject) => {
      img.onload = () => {
        const entry = cache.get(normalized)
        if (entry) {
          entry.loaded = true
        }
        resolve()
      }
      img.onerror = (err) => reject(err)
    })
    img.src = normalized
    const entry: ImageEntry = { img, loaded: img.complete, promise }
    cache.set(normalized, entry)
    return entry
  }

  async function preload(url: string): Promise<HTMLImageElement> {
    const entry = ensureEntry(url)
    try {
      await entry.promise
    } catch {
      // 失敗時もキャッシュは残すが loaded=false のまま
    }
    return entry.img
  }

  async function preloadAll(urls: readonly string[]): Promise<void> {
    await Promise.all(urls.map((u) => preload(u)))
    ready.value = true
    if (ENABLE_LOG) {
      console.info('[ImageHub] preloaded', urls.length)
    }
  }

  function getSrc(url: string | undefined): string | undefined {
    if (!url) return undefined
    return normalizePath(url)
  }

  function getElement(url: string | undefined): HTMLImageElement | undefined {
    if (!url) return undefined
    const entry = ensureEntry(url)
    return entry.img
  }

  return { preloadAll, getSrc, getElement, ready }
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
