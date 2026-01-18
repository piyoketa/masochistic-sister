import { defineStore } from 'pinia'
import type { AudioHub } from '@/composables/audioHub'

interface AudioState {
  bgmVolume: number
  seVolume: number
  hub: AudioHub | null
}

export const useAudioStore = defineStore('audio', {
  state: (): AudioState => ({
    bgmVolume: 0.1,
    // 設計判断: 音量スライダーは 0〜1 の正規化値なので、初期値 50% は 0.5 に合わせる。
    seVolume: 0.5,
    hub: null,
  }),
  actions: {
    setHub(hub: AudioHub) {
      this.hub = hub
      this.hub.setBgmVolume(this.bgmVolume)
    },
    setBgmVolume(volume: number) {
      this.bgmVolume = Math.min(1, Math.max(0, volume))
      this.hub?.setBgmVolume(this.bgmVolume)
    },
    setSeVolume(volume: number) {
      this.seVolume = Math.min(1, Math.max(0, volume))
    },
    playBgm(id: string | undefined) {
      if (!this.hub) return
      this.hub.setBgmVolume(this.bgmVolume)
      this.hub.playBgm(id)
    },
    stopBgm() {
      this.hub?.stopBgm()
    },
    playSe(id: string | undefined) {
      if (!this.hub) return
      this.hub.play(id, { volume: this.seVolume })
    },
  },
})
