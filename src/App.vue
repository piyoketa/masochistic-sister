<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import { createAudioHub, provideAudioHub } from '@/composables/audioHub'
import { createImageHub, provideImageHub } from '@/composables/imageHub'
import { SOUND_ASSETS, IMAGE_ASSETS } from '@/assets/preloadManifest'
import DescriptionOverlayLayer from '@/components/DescriptionOverlayLayer.vue'
import PileOverlay from '@/components/battle/PileOverlay.vue'
import ActionCardOverlayLayer from '@/components/ActionCardOverlayLayer.vue'
import RelicCardOverlayLayer from '@/components/RelicCardOverlayLayer.vue'
import { useAudioStore } from '@/stores/audioStore'
import { usePileOverlayStore } from '@/stores/pileOverlayStore'

// アプリ全体で使い回す Hub を生成し、画面遷移でも破棄されないよう最上位で provide する。
const appAudioHub = createAudioHub(SOUND_ASSETS)
const appImageHub = createImageHub()
provideAudioHub(appAudioHub)
provideImageHub(appImageHub)
const audioStore = useAudioStore()
const pileOverlayStore = usePileOverlayStore()
audioStore.setHub(appAudioHub)
const isVolumePanelOpen = ref(false)
const bgmVolume = computed({
  get: () => audioStore.bgmVolume,
  set: (v: number) => audioStore.setBgmVolume(v),
})
const seVolume = computed({
  get: () => audioStore.seVolume,
  set: (v: number) => audioStore.setSeVolume(v),
})

onMounted(() => {
  void appAudioHub.preloadAll().catch(() => undefined)
  void appImageHub.preloadAll(IMAGE_ASSETS).catch(() => undefined)
})

watch(
  () => audioStore.bgmVolume,
  (volume) => {
    appAudioHub.setBgmVolume(volume)
  },
  { immediate: true },
)

function toggleVolumePanel(): void {
  isVolumePanelOpen.value = !isVolumePanelOpen.value
}
</script>

<template>
  <div class="app-frame">
    <RouterLink class="back-to-title" to="/">← タイトルへ戻る</RouterLink>
    <button class="volume-toggle" type="button" @click="toggleVolumePanel" aria-label="音量設定">
      <v-icon icon="mdi-volume-high" size="20" color="white" />
    </button>
    <transition name="volume-panel">
      <div v-if="isVolumePanelOpen" class="volume-panel" role="dialog" aria-label="音量調整">
        <div class="volume-panel__row">
          <label class="volume-panel__label" for="global-bgm-volume">BGM</label>
          <input
            id="global-bgm-volume"
            v-model.number="bgmVolume"
            class="volume-panel__slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
          />
          <span class="volume-panel__value">{{ Math.round(bgmVolume * 100) }}%</span>
        </div>
        <div class="volume-panel__row">
          <label class="volume-panel__label" for="global-se-volume">SE</label>
          <input
            id="global-se-volume"
            v-model.number="seVolume"
            class="volume-panel__slider"
            type="range"
            min="0"
            max="1"
            step="0.01"
          />
          <span class="volume-panel__value">{{ Math.round(seVolume * 100) }}%</span>
        </div>
      </div>
    </transition>
    <RouterView />
    <DescriptionOverlayLayer />
    <ActionCardOverlayLayer />
    <RelicCardOverlayLayer />
    <PileOverlay
      :active-pile="pileOverlayStore.activePile"
      :deck-cards="pileOverlayStore.deckCards"
      :discard-cards="pileOverlayStore.discardCards"
      @close="pileOverlayStore.close()"
    />
  </div>
</template>

<style>
html,
body {
  margin: 0;
  background-color: #ffffff;
  color: #1f1f1f;
  font-family: 'Inter', 'Noto Sans JP', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.app-frame {
  min-height: 100vh;
}

.back-to-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  margin: 8px;
  border-radius: 999px;
  background: rgba(13, 13, 24, 0.75);
  color: #f1e7ff;
  text-decoration: none;
  font-size: 13px;
  letter-spacing: 0.08em;
  border: 1px solid rgba(255, 255, 255, 0.15);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.back-to-title:hover,
.back-to-title:focus-visible {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(25, 25, 45, 0.9);
}

.volume-toggle {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 1000;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(13, 13, 24, 0.82);
  border: 1px solid rgba(255, 255, 255, 0.15);
  cursor: pointer;
  font-size: 18px;
  user-select: none;
}

.volume-toggle:hover,
.volume-toggle:focus-visible {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(25, 25, 45, 0.9);
}

.volume-panel {
  position: fixed;
  top: 56px;
  right: 12px;
  z-index: 1000;
  width: min(320px, 94vw);
  padding: 14px;
  border-radius: 12px;
  background: rgba(10, 10, 18, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(6px);
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #f2ecff;
}

.volume-panel__row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
}

.volume-panel__label {
  font-size: 13px;
  letter-spacing: 0.08em;
}

.volume-panel__slider {
  width: 100%;
}

.volume-panel__value {
  width: 48px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.volume-panel-enter-active,
.volume-panel-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
}

.volume-panel-enter-from,
.volume-panel-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
