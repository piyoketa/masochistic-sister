import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      css: true,
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
      ssr: {
        noExternal: ['vuetify'],
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
  }),
)
