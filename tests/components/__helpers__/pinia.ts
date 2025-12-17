import { createPinia, setActivePinia } from 'pinia'

/**
 * Pinia を利用するコンポーネントテストで、useAudioStore などの取得時に
 * getActivePinia が失敗しないよう、テスト用の Pinia インスタンスを生成・適用する。
 */
export function createActivatedTestingPinia() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return pinia
}
