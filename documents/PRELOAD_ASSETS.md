# アセットの事前ロードと使い回しの仕組みまとめ

## 1. マニフェスト生成（src/assets/preloadManifest.ts）
- `import.meta.glob` で `/public/sounds/**/*` と `/public/assets/**/*` を列挙し、`normalizePublicPath` で `/sounds/...` `/assets/...` 形式に正規化して重複排除。
- ダメージ効果音定義（`utils/damageSounds.ts`）の `src` も取り込み `SOUND_ASSETS` に統合。
- エクスポート:
  - `SOUND_ASSETS`: すべての音源パス。
  - `IMAGE_ASSETS`: すべての画像パス（`/assets` 配下全件）。
  - `BATTLE_AUDIO_ASSETS`: 現状は `SOUND_ASSETS` と同一。
  - `BATTLE_CUTIN_ASSETS`: 画像のうち `/cut_ins/` を含むもの。
  - `DAMAGE_EFFECT_AUDIO_ASSETS`: ダメージ効果音の詳細（id, src）。
- ログ制御: `VITE_ASSET_PRELOAD_LOG` が `true` / `1` で件数やフォールバック状況を `console.info` / `console.warn` に出力。

## 2. ルートでのプリロード（src/App.vue）
- アプリ起動時に `createAudioHub(SOUND_ASSETS)` と `createImageHub()` を生成し `provide`。画面遷移でも Hub は共有される。
- `onMounted` で
  - `appAudioHub.preloadAll()` … すべてのサウンドを Howler で先読み。
  - `appImageHub.preloadAll(IMAGE_ASSETS)` … すべての画像を `Image` 要素で先読み。
- これによりタイトル以外の画面でも再ロードを避け、描画遅延を抑制。

## 3. AudioHub（src/composables/audioHub.ts）
- Howler.js をラップしたハブ。`soundIds`（= `SOUND_ASSETS`）を元に `Howl` を生成・キャッシュ。
- `preloadAll` は二重呼び出し防止のため `preloadPromise` を保持。すでに `loaded` 状態なら即 resolve。
- `play/ playBgm` は再利用時にキャッシュされた `Howl` を使い回す。未ロードなら `preload: true` で作成し、失敗時は warn のみ。
- `normalizeSoundPath` で `BASE_URL` を考慮した絶対パスに統一。HTTP指定も許容。
- `useAudioHub` は provide が無い場合、フォールバック Hub を生成してゆるくプリロードを開始（テスト・バトル外でも安全）。

## 4. ImageHub（src/composables/imageHub.ts）
- `Image` オブジェクトをキャッシュするシンプルなハブ。`preloadAll(urls)` で全件 `ensureEntry` → `img.src` セットし、`onload` で `loaded` フラグ更新。
- `normalizePath` で `BASE_URL` を考慮した絶対パスに統一。HTTP指定も許容。
- `getSrc` は正規化された文字列のみ返し、副作用なし。`getElement` はキャッシュを作成しつつ `Image` を返す。
- `useImageHub` も provide 無し時にフォールバック Hub を生成し、`IMAGE_ASSETS` のプリロードを開始。

## 5. 使い回しのポイント
- **共有キャッシュ**: AudioHub/ImageHub をルートで provide し、各ビューは `useAudioHub` / `useImageHub` で同一インスタンスを利用するため、再ロードが起きにくい。
- **パス正規化**: すべてのパスは `/sounds/...` `/assets/...` に正規化し、`BASE_URL` が変わっても参照可能。
- **ログ/フォールバック**: Vite の `glob` が失敗した場合も空配列で進行し、ログを出すのみでクラッシュしない。フォールバック Hub も安全策として動作。

## 6. 現状のカバレッジ
- `/public/assets/**/*` はすべて `IMAGE_ASSETS` に含まれ、アイコン系画像もプリロード対象になる設計。
- `/public/sounds/**/*` はすべて `SOUND_ASSETS` に含まれ、効果音定義の追加分も統合される。

## 7. 今後の拡張時の指針
- 新しいアセットディレクトリを追加する場合は `preloadManifest.ts` の `glob` 対象を増やす。
- ロード順の優先度やカテゴリ別の絞り込みが必要な場合は `IMAGE_ASSETS` をフィルタリングしたサブセットを追加定義する。
- 大容量アセットはプリロードを避ける or 遅延ロード用の別マニフェストを持つ運用に分離する。
