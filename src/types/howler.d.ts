declare module 'howler' {
  // 簡易型定義: howler.js を any 互換で扱い、必要メソッドのみ許容する
  export interface HowlOptions {
    src: string[] | string
    preload?: boolean
    volume?: number
    loop?: boolean
    onload?: () => void
    onloaderror?: () => void
  }

  export class Howl {
    constructor(options: HowlOptions)
    play(id?: string | number): number
    state(): 'unloaded' | 'loading' | 'loaded'
    once(event: 'load' | 'loaderror', callback: () => void): void
    volume(value?: number): number
    rate(value?: number): number
    loop(value?: boolean): boolean
    stop(): void
    unload(): void
  }

  export const Howler: {
    ctx?: AudioContext | null
    mute(muted: boolean): void
    stop(): void
  }
}
