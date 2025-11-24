// preloadManifest.ts の責務:
// - BattleView 起動時に先読みしたい音声・カットイン画像のリストを一元管理する。
// - 実行時に計算せず済むよう、ハードコードされた配列で提供する。
// - 将来的にアセット追加があればここに追記するだけでプレロード対象へ反映される。

import { damageSoundAssets } from '@/utils/damageSounds'

/** `useAudioCue` で再生する短尺SEの soundId 一覧 */
export const BATTLE_AUDIO_ASSETS: readonly string[] = [
  'skills/kurage-kosho_teleport01.mp3', // 被虐のオーラ
  'skills/kurage-kosho_status03.mp3', // ビルドアップ / 戦いの舞い
  'skills/OtoLogic_Electric-Shock02-Short.mp3', // 足止め
]

/** CutInOverlay で使用するカットイン画像パス一覧（public 配下起点） */
export const BATTLE_CUTIN_ASSETS: readonly string[] = [
  '/assets/cut_ins/MasochisticAuraAction.png',
]

/** DamageEffects で使用するサウンドアセット一覧（AudioPreloader 用） */
export const DAMAGE_EFFECT_AUDIO_ASSETS = damageSoundAssets
