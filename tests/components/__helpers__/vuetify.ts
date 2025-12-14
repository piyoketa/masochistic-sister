import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

/**
 * Vuetify を利用するコンポーネントテストで defaults インスタンス未初期化エラーを防ぐための薄いラッパー。
 * 必要最低限の components / directives をまとめて登録する。
 */
export function createTestingVuetify() {
  return createVuetify({
    components,
    directives,
  })
}
