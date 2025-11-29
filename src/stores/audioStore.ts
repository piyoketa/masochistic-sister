import { defineStore } from 'pinia'

interface AudioState {
  bgmVolume: number
  seVolume: number
}

export const useAudioStore = defineStore('audio', {
  state: (): AudioState => ({
    bgmVolume: 0.3,
    seVolume: 1.0,
  }),
  actions: {
    setBgmVolume(volume: number) {
      this.bgmVolume = Math.min(1, Math.max(0, volume))
    },
    setSeVolume(volume: number) {
      this.seVolume = Math.min(1, Math.max(0, volume))
    },
  },
})
