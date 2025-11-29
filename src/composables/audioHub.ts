/**
 * AudioHub (howler.js版)
 * ======================
 * - サウンドのプリロードと再生を howler.js で一元管理する。
 * - provide/inject で子コンポーネントに共有し、二重プリロードや散逸を防ぐ。
 */
import { Howl, Howler } from 'howler'
import { inject, provide, ref } from 'vue'
import { SOUND_ASSETS } from '@/assets/preloadManifest'

export interface AudioHub {
  preloadAll(): Promise<void>
  play(id: string | undefined, options?: { volume?: number; playbackRate?: number; loop?: boolean }): void
  stopAll(): void
  ready: Readonly<{ value: boolean }>
  playBgm(id: string | undefined): void
  stopBgm(): void
  setBgmVolume(volume: number): void
}

export const AUDIO_HUB_KEY = Symbol('audio-hub')
let fallbackAudioHub: AudioHub | null = null

const ENABLE_LOG =
  String(import.meta.env?.VITE_ASSET_PRELOAD_LOG ?? '').toLowerCase() === 'true' ||
  String(import.meta.env?.VITE_ASSET_PRELOAD_LOG ?? '') === '1'

function normalizeSoundPath(id: string): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/'
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  if (id.startsWith('http://') || id.startsWith('https://')) return id
  if (id.startsWith('/')) return `${normalizedBase}${id}`
  return `${normalizedBase}/sounds/${id.replace(/^\/+/, '')}`
}

export function createAudioHub(soundIds: readonly string[]): AudioHub {
  const ready = ref(false)
  let preloadPromise: Promise<void> | null = null
  const howls = new Map<string, Howl>()
  let bgm: { id: string; howl: Howl } | null = null

  async function preloadAll(): Promise<void> {
    if (preloadPromise) return preloadPromise
    preloadPromise = (async () => {
      const tasks = soundIds.map((id) => {
        const src = normalizeSoundPath(id)
        let howl = howls.get(src)
        if (!howl) {
          howl = new Howl({ src: [src], preload: true })
          howls.set(src, howl)
        }
        return new Promise<void>((resolve) => {
          if (howl!.state() === 'loaded') {
            resolve()
            return
          }
          howl!.once('load', () => resolve())
          howl!.once('loaderror', () => resolve()) // 失敗しても先に進む
        })
      })
      await Promise.all(tasks)
      ready.value = true
      if (ENABLE_LOG) {
        console.info('[AudioHub] preloaded', howls.size)
      }
    })()
    return preloadPromise
  }

  function play(id: string | undefined, options?: { volume?: number; playbackRate?: number; loop?: boolean }): void {
    if (!id || typeof window === 'undefined') return
    if (import.meta.env.MODE === 'test') return
    const key = normalizeSoundPath(id)
    let howl = howls.get(key)
    if (!howl) {
      howl = new Howl({ src: [key], preload: true, onloaderror: () => console.warn(`[AudioHub] failed to load sound: ${key}`) })
      howls.set(key, howl)
    }
    if (options?.volume !== undefined) howl.volume(Math.min(1, Math.max(0, options.volume)))
    if (options?.playbackRate !== undefined) howl.rate(Math.max(0.5, Math.min(4, options.playbackRate)))
    howl.loop(Boolean(options?.loop))
    howl.play()
  }

  function playBgm(id: string | undefined): void {
    if (!id || typeof window === 'undefined') return
    if (import.meta.env.MODE === 'test') return
    const key = normalizeSoundPath(id)
    // 既存BGMが同一の場合は何もしない（再スタートさせない）
    if (bgm && bgm.id === key) {
      return
    }
    // 別の曲が鳴っていれば停止してから差し替える
    if (bgm) {
      bgm.howl.stop()
      bgm = null
    }
    let howl = howls.get(key)
    if (!howl) {
      howl = new Howl({
        src: [key],
        preload: true,
        loop: true,
        onloaderror: () => console.warn(`[AudioHub] failed to load BGM: ${key}`),
      })
      howls.set(key, howl)
    } else {
      howl.loop(true)
    }
    bgm = { id: key, howl }
    howl.play()
  }

  function stopBgm(): void {
    if (bgm) {
      bgm.howl.stop()
      bgm = null
    }
  }

  function setBgmVolume(volume: number): void {
    if (bgm) {
      bgm.howl.volume(Math.min(1, Math.max(0, volume)))
    }
  }

  function stopAll(): void {
    stopBgm()
    howls.forEach((howl) => howl.stop())
    Howler.stop()
  }

  return { preloadAll, play, stopAll, playBgm, stopBgm, setBgmVolume, ready }
}

export function provideAudioHub(hub: AudioHub): void {
  provide(AUDIO_HUB_KEY, hub)
}

export function useAudioHub(): AudioHub {
  const hub = inject<AudioHub>(AUDIO_HUB_KEY)
  if (hub) return hub
  // バトル外でもエラーにならないよう、フォールバックの Hub を生成する
  if (!fallbackAudioHub) {
    fallbackAudioHub = createAudioHub(SOUND_ASSETS)
    // 起動時にゆるくプリロードを開始しておく
    void fallbackAudioHub.preloadAll().catch(() => undefined)
  }
  return fallbackAudioHub
}
