// preloadManifest.ts の責務:
// - public/sounds 配下の音声、public/assets 配下の画像を全件列挙し、プリロード対象を一元管理する。
// - BattleView などからのプリロード呼び出し時に、このマニフェストを参照するだけで全アセットを先読みできるようにする。
// - ログ出力は共通環境変数（VITE_ASSET_PRELOAD_LOG）で制御する。

import { damageSoundAssets } from '@/utils/damageSounds'

const ENABLE_PRELOAD_LOG =
  String(import.meta.env?.VITE_ASSET_PRELOAD_LOG ?? '').toLowerCase() === 'true' ||
  String(import.meta.env?.VITE_ASSET_PRELOAD_LOG ?? '') === '1'

function normalizePublicPath(url: string): string {
  // public 配下の絶対/相対パスを `/sounds/...` `/assets/...` に正規化する。
  return url.replace(/^(?:\/?public)?\/?/, '/')
}

function dedupe(list: string[]): string[] {
  return Array.from(new Set(list))
}

// 全音声（/sounds/**）
let globSoundAssets: string[] = []
try {
  const modules = import.meta.glob('/public/sounds/**/*', { eager: true, as: 'url' })
  globSoundAssets = Object.values(modules).map((value) => normalizePublicPath(String(value)))
  if (ENABLE_PRELOAD_LOG) {
    console.info('[preloadManifest] glob sounds', globSoundAssets.length)
  }
} catch (error) {
  if (ENABLE_PRELOAD_LOG) {
    console.warn('[preloadManifest] glob sounds fallback', error)
  }
  globSoundAssets = []
}

// 全画像（/assets/**）
let globImageAssets: string[] = []
try {
  const modules = import.meta.glob('/public/assets/**/*', { eager: true, as: 'url' })
  globImageAssets = Object.values(modules).map((value) => normalizePublicPath(String(value)))
  if (ENABLE_PRELOAD_LOG) {
    console.info('[preloadManifest] glob assets', globImageAssets.length)
  }
} catch (error) {
  if (ENABLE_PRELOAD_LOG) {
    console.warn('[preloadManifest] glob assets fallback', error)
  }
  globImageAssets = []
}

// ダメージ効果音の定義からも src を取り込み、重複を除去
const damageSoundSrcs = damageSoundAssets.map((entry) => entry.src)

export const SOUND_ASSETS: readonly string[] = dedupe([...globSoundAssets, ...damageSoundSrcs])
export const IMAGE_ASSETS: readonly string[] = dedupe([...globImageAssets])

/** `audioHub` で再生する短尺SEの soundId 一覧（今回は全音声を対象） */
export const BATTLE_AUDIO_ASSETS: readonly string[] = SOUND_ASSETS

/** CutInOverlay で使用するカットイン画像パス一覧（public 配下起点） */
export const BATTLE_CUTIN_ASSETS: readonly string[] = IMAGE_ASSETS.filter((src) =>
  src.includes('/cut_ins/'),
)

/** DamageEffects で使用するサウンドアセット一覧（AudioPreloader 用） */
export const DAMAGE_EFFECT_AUDIO_ASSETS = damageSoundAssets

if (ENABLE_PRELOAD_LOG) {
  console.info('[preloadManifest] SOUND_ASSETS', SOUND_ASSETS.length)
  console.info('[preloadManifest] IMAGE_ASSETS', IMAGE_ASSETS.length)
  console.info('[preloadManifest] CUTIN_ASSETS', BATTLE_CUTIN_ASSETS.length)
}
