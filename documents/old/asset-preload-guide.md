# 音声・カットイン画像の追加手順（プリロード連携）

## 目的
新しい効果音やカットイン画像を追加するときに、プリロード対象へ漏れなく登録し、再生時のネットワーク遅延を避けるための手順を示す。

## 手順
1. **アセットを配置する**
   - 音声: `public/sounds/**` に追加（例: `public/sounds/skills/new-skill.mp3`）。
   - カットイン画像: `public/assets/cut_ins/**` に追加（例: `public/assets/cut_ins/NewSkill.png`）。

2. **プリロードマニフェストへ登録**（`src/assets/preloadManifest.ts`）
   - 音声: `BATTLE_AUDIO_ASSETS` 配列に soundId を追記（先頭の `/sounds/` は不要）。例: `'skills/new-skill.mp3'`
   - カットイン画像: `BATTLE_CUTIN_ASSETS` 配列に `/assets/cut_ins/...` を追記。
   - ダメージ効果音: 通常は追記不要。新しい effectType を増やす場合は `src/utils/damageSounds.ts` にバンド定義を追加すると `DAMAGE_EFFECT_AUDIO_ASSETS` に反映される。

3. **Action での指定**
   - 効果音: Action 定義の `audioCue.soundId` にマニフェスト登録した soundId を設定。
   - カットイン: Action 定義の `cutInCue.src` に `/assets/cut_ins/...` を設定（マニフェストと揃える）。

4. **プリロードの仕組み**
   - `BattleView` がマニフェストをもとにマウント時プリロードを実行するため、追加作業は不要。
   - `DamageEffects` は `DAMAGE_EFFECT_AUDIO_ASSETS` を使用。新しいダメージ効果音は `damageSounds.ts` に追加すれば自動でプリロード対象になる。

5. **動作確認**
   - `npm run dev` で `/demo/damage-effects`（効果音）、`/demo/cut-in`（カットイン）を開いて再生確認。
   - DevTools ネットワークで `/sounds/` や `/assets/cut_ins/` への 200/304 が出ない（`blob:` 読み出しのみ）ことを確認するとプリロードが効いている。

6. **ドキュメント・コミット**
   - 必要に応じて `materials/sounds/SOUND.md` などに追記。
   - 追加したバイナリ（音声/画像）も忘れずにコミットする。
