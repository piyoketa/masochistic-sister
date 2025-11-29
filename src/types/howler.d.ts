declare module 'howler' {
  export class Howl {
    constructor(options: {
      src: string[] | string
      preload?: boolean
      volume?: number
      loop?: boolean
      onload?: () => void
      onloaderror?: () => void
    })
    play(id?: string | number): number
    state(): 'unloaded' | 'loading' | 'loaded'
    once(event: 'load', callback: () => void): void
    once(event: 'loaderror', callback: () => void): void
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
