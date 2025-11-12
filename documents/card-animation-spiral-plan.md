# Card Animation Spiral Variation 計画

## 目的
- `card-eliminate` のワイプ演出に「円＋欠け」の渦巻きパターンを追加し、既存の円形ワイプとの差分を検証できるようにする。
- CardAnimationLabView に複数バリエーションを切り替えられる UI を整備し、将来の比較に耐えられる構造にする。

## 実装ステップ
1. **アニメーション仕様の整理**
   - CSS `clip-path` または SVG マスクを使い、円の一部が欠けた状態で回転→縮小するパターンを定義する。
   - `@property --spiral-angle` のようなカスタムプロパティを使い、conic-gradient と合わせて渦巻き感を出す。

2. **CardAnimationLabView の UI 拡張**
   - leave animation セクションにトグル or ラジオボタンを追加し、`circle` / `spiral` など複数モードを切り替えられるようにする。
   - `Transition` をパターンごとに切り替えやすいコンポーネント or computed クラス構造へリファクタする。

3. **CSS アニメーション追加**
   - `.card-wipe` 既存クラスに手を入れず、新たに `.card-wipe--spiral` を用意。
   - `clip-path: path('...')` や `mask` を使って欠けを作り、`transform: rotate` と custom property で回転アニメーションを実装。

4. **動作確認**
   - `pnpm run dev` で `/lab/card-animations` を開き、両バリエーションの enter/leave が期待通りかを確認。
   - アニメーション切替時にコンテンツがちらつかないか、モバイル幅でも UI が崩れないかチェック。

## 不明点 / 要確認事項
1. **渦巻きの表現方法**
   - 選択肢 A: CSS `conic-gradient` + `mask-composite` を使ったピュア CSS。
   - 選択肢 B: `<svg>` フィルター or マスクを `clip-path` 経由で適用。
   - **提案**: A（CSS のみ）。実験目的であり、メンテ容易なほうが望ましい。

2. **切替 UI の形式**
   - 選択肢 A: ラジオボタンでアニメーション種別を明示。
   - 選択肢 B: 複数のボタンで直接再生。
   - **提案**: A（コンパクトに管理でき、将来種類が増えても整理しやすい）。

3. **enter animation との整合**
   - 渦巻きパターンは leave 用だが、enter にも適用するか？
   - **提案**: 今回は leave のみ。enter にも適用したい場合は次フェーズで検討。
