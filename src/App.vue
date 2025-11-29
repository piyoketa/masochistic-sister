<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { RouterView } from 'vue-router'
import { createAudioHub, provideAudioHub } from '@/composables/audioHub'
import { createImageHub, provideImageHub } from '@/composables/imageHub'
import { SOUND_ASSETS, IMAGE_ASSETS } from '@/assets/preloadManifest'
import DescriptionOverlayLayer from '@/components/DescriptionOverlayLayer.vue'
import { useAudioStore } from '@/stores/audioStore'

// アプリ全体で使い回す Hub を生成し、画面遷移でも破棄されないよう最上位で provide する。
const appAudioHub = createAudioHub(SOUND_ASSETS)
const appImageHub = createImageHub()
provideAudioHub(appAudioHub)
provideImageHub(appImageHub)
const audioStore = useAudioStore()

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
</script>

<template>
  <div class="app-frame">
    <RouterLink class="back-to-title" to="/">← タイトルへ戻る</RouterLink>
    <RouterView />
    <DescriptionOverlayLayer />
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
</style>
