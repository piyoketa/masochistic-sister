# preloadManifest 一元管理計画

## 目的
- `src/assets/preloadManifest.ts` に、事前ロードすべき音声・カットイン画像・その他画像を一元化し、BattleView などからのプリロード呼び出しを一本化する。
- 今後アセットを追加した際に、マニフェストだけ更新すれば自動でプリロードされる状態にする。
- 併せて、音声・画像のプリロード/再生/取得を Hub（provide/inject）で集中管理し、個別コンポーネントの重複ロードを排除する。

## 要件
- `public/sounds/**` 配下の音声ファイルをすべてマニフェストに列挙する（ファイル数による負荷は今回考慮せず、起動時に全件プリロードする）。
- `public/assets/**` 配下の画像ファイルをすべてマニフェストに列挙する（カットイン画像を含む。同じく全件プリロード）。
- `preloadManifest.ts` で ID とパスを決め打ちせず、原則として「ファイル名一覧を取り込んで配列化」する形を採用する。
- 既存の `BATTLE_AUDIO_ASSETS` / `BATTLE_CUTIN_ASSETS` といった用途別の配列は、上記全件リストから派生して構築する。

## 実装方針
1. **マニフェスト構造**
   - `export const SOUND_ASSETS: string[]` … `/sounds/...` 形式で `public/sounds` 以下を全列挙。
   - `export const IMAGE_ASSETS: string[]` … `/assets/...` 形式で `public/assets` 以下を全列挙。
   - 既存の用途別配列（例: `BATTLE_AUDIO_ASSETS`, `BATTLE_CUTIN_ASSETS`, `DAMAGE_EFFECT_AUDIO_ASSETS`）は、それぞれ SOUND/IMAGE からフィルタして組み立てる。
   - カットイン画像は `IMAGE_ASSETS.filter((p) => p.includes('/cut_ins/'))` のように抽出。

2. **列挙ロジック**
   - Vite 開発環境/ビルド環境で `import.meta.glob` を利用し、`public/sounds/**`, `public/assets/**` を対象にパスを抽出する。
   - 返却されるキーはビルド時に `/src/...` になるため、`replace(/^\\.\\.?\\/public/, '')` 等で `/sounds/...` `/assets/...` に正規化する。
   - `process.env.NODE_ENV === 'test'` などで glob が使えない場合に備え、フォールバックの静的配列を残す（最小限のセットで OK）。

3. **プリロード利用側の更新**
   - `BattleView` の `preloadBattleAssets` を、`SOUND_ASSETS` / `IMAGE_ASSETS` に基づく一括プリロードに差し替え。
   - `DamageEffects` / `EnemyCard` / `CutInOverlay` / `PlayerImageComponent` は、個別プリロード処理を削除して Hub 経由に変更予定（別タスクで AudioHub/ImageHub を導入）。

4. **注意点・確認事項**
   - 起動時に全件プリロードする（負荷分散は現時点で不要）。
   - 既存のユニット/インテグレーションテストで、マニフェスト依存部分のモックが必要になる可能性があるため、テスト環境用フォールバックを明示。
   - 音声・画像アセット系のログ出力は共通の環境変数（例: `VITE_ASSET_PRELOAD_LOG=1`）で ON/OFF できるようにする。

5. **作業手順（このタスクでやる範囲）**
   - `documents/preload-manifest-plan.md` の作成（本ファイル）。
   - `src/assets/preloadManifest.ts` を全件列挙方式に書き換え（`import.meta.glob` 採用、フォールバック付き）。
   - 既存のマニフェスト配列を新方式に合わせて更新（用途別フィルタもここで組み立て）。
   - BattleView など、直接 `BATTLE_AUDIO_ASSETS` / `BATTLE_CUTIN_ASSETS` を参照している箇所があれば、名称/構造変更に追随。
   - Hub での提供を想定し、マニフェストのログ制御用環境変数（`VITE_ASSET_PRELOAD_LOG`）を共通にする。

6. **今後の拡張（別タスク）**
   - AudioHub / ImageHub を導入し、再生・取得を集中管理（provide/inject で統一）。
     - AudioHub: `provide('audioHub', { preload(ids), play(id, opts), stopAll() })`。内部は howler.js に統一。
     - ImageHub: `provide('imageHub', { preload(urls), get(url) })`。内部で Image オブジェクトをキャッシュ。
   - DamageEffects / EnemyCard / PlayerImageComponent / CutInOverlay の個別プリロード処理を削除し、Hub から提供される API で統一。
     - DamageEffects/EnemyCard: 効果音再生は audioHub.play のみ。プリロード状態管理を削除。
     - PlayerImageComponent/CutInOverlay: 画像取得は imageHub.preload → imageHub.get に委譲。内部 preloadPromise を削除。
     - BattleView: Hub を生成・provide し、マウント時に `SOUND_ASSETS` / `IMAGE_ASSETS` を一括プリロード。アンマウント時に stopAll/クリアを実行。
   - テスト: Hub をモックできるよう provide キーを定数化し、テスト環境フォールバックを維持。
