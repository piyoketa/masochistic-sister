import { vi } from 'vitest'
import { config } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// jsdom では HTMLCanvasElement.getContext が未実装のため、警告/例外を抑制するスタブを差し込む
if (typeof HTMLCanvasElement !== 'undefined') {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null)
}

// Vuetifyコンポーネント（v-icon等）がテスト中に出るため、グローバルに簡易インスタンスを挿入して注入エラーを防ぐ。
const vuetify = createVuetify({ components, directives })
config.global.plugins = [...(config.global.plugins ?? []), vuetify]
