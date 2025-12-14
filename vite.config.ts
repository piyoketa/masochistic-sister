import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // VuetifyのCSSをSSR/テスト環境でもVite経由で解釈させるため、外部化を抑制する
  ssr: {
    noExternal: ['vuetify'],
  },
  server: {
    host: '0.0.0.0',
    // /mnt/c 上でもファイル変更を検知しやすくするための設定
    watch: {
      // ポーリングモードにする（イベントが飛んでこない環境向け）
      usePolling: true,
      // 監視間隔（ms）。負荷と反応速度のバランスで調整。
      interval: 200,
    },
  },
})
