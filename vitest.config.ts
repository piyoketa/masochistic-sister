import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults, type UserConfig } from 'vitest/config'
import viteConfig from './vite.config'

const vitestConfig = defineConfig({
  test: {
    environment: 'jsdom',
    css: true,
    setupFiles: ['./tests/setup.ts'],
    // VuetifyのCSSはNodeがそのまま解釈できないため、依存をインライン変換してVite経由で処理する
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    deps: {
      optimizer: {
        web: {
          include: ['vuetify'],
        },
      },
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    exclude: [...configDefaults.exclude, 'e2e/**'],
    root: fileURLToPath(new URL('./', import.meta.url)),
  },
})

export default mergeConfig(viteConfig as UserConfig, vitestConfig)
