# ActionCard実験ページ実装計画

## ゴール
- Model 層に Action 一覧へ直接アクセスできる `Library` オブジェクトを追加し、フロントの任意の箇所から実験用途で参照できるようにする。
- 既存の `ActionCard` を複数行にレイアウト・スクロール表示できる `CardList.vue` を新設し、重なりなしでカードを並べる仕組みを整える。
- Vue Router に「ActionCardの実験場」ページを追加し、背景グラデーション調整前後のカードを同時に比較できる UI を用意する。
- 既存ページのスタイルや挙動には影響を与えず、実験ページ配下の CSS でのみ新しい配色を適用する。

## 前提と制約
- 新規 Vue コンポーネント／クラスには責務説明コメントをファイル先頭に記載する。
- Model ↔ View の正式な通信経路は維持し、Library だけを「どこからでも直接呼べる」特例とする。
- ActionCard 配色差分は実験ページでのみ適用し、`ActionCard.vue` 自体の既存スタイルは変更しない。
- CardList は可変高さ・縦スクロールを持ち、カード幅 94px を前提に CSS Grid / Flex で整列させる。

## 実装ステップ

### 1. Library オブジェクトの追加
1. `src/domain/library/Library.ts`（仮）を新設し、責務コメント・型定義を記載する。
2. `entities/actions/index.ts` を利用して Action クラスを列挙し、インスタンス化して `Action` 配列を返す stateless API（例：`listActions()`）を提供する。
3. UI で使いやすい `CardInfo` への変換ヘルパーを Library 内に用意する。`CardDefinition` や `CardTag` から `CardTagInfo` を構築し、Attack であれば基礎ダメージ情報も付与する。
4. Library が単体で動くよう最小限の依存（Action クラス・カードタグ）だけを import し、Battle など重量級オブジェクトを参照しないようコメントで明記する。

### 2. CardList.vue の実装
1. `src/components/CardList.vue` を追加し、責務コメントに「カード並べ替え表示のみを担い、操作/状態管理は行わない」旨を記述する。
2. Props: `cards: CardInfo[]`, `title?: string`, `maxHeight?: number | string`, `gap?: number` などを想定し、幅 94px 固定の `ActionCard` を `display: grid` + `grid-template-columns: repeat(auto-fill, minmax(94px, max-content))` で整列させる。
3. 親から高さを指定できるよう `style="max-height: ..."`, `overflow-y: auto` を受け取る。省略時は 320px 程度のデフォルト。
4. 既存 `ActionCard` をそのままレンダリングし、スクロール・余白・タイトル表示といった補助 UI だけを担当する。

### 3. 実験ページ（ActionCard Lab View）
1. `src/views/ActionCardLabView.vue` を新設し、冒頭コメントで責務/非責務/通信相手を整理する。
2. ページ内部で `const library = new Library()` を生成し、`library.listCardInfos()`（仮）から `CardInfo` を取得。タイプ別に `skill/attack/status` へ仕分けし、上限枚数（例: 10 枚）を決めて描画する。
3. UI セクション構成例:
   - 「従来デザイン」CardList（skill/attack/status をまとめて表示）。
   - 「新デザイン（Skill/Attackのみ変更）」CardList。
   - 必要ならタイプ別ヘッダーを `CardList` のタイトル slot/prop で表示。
4. 新色はビュー内の CSS で `:deep(.action-card)` を対象にし、`before`/`after` の親ラッパーにクラスを付けて `background: linear-gradient(...) !important` を切り替える。右下の色付きは `radial-gradient` または `conic-gradient` を重ねた擬似要素で表現する。

### 4. ルーティングとナビゲーション最小化
1. `src/router/index.ts` に `/lab/action-cards`（仮）を追加し、`ActionCardLabView.vue` を遅延 import で登録する。
2. 既存タイトル等からのリンク追加は要求されていないため見送るが、将来リンクする際のためにルート名 `action-card-lab` を定義。

### 5. 配色バリエーション実装
1. Skill 新配色: 既存 `--card-bg-start` を流用しつつ、`--card-bg-end` 相当を「緑よりの黄色」に差し替え、`:deep` でカードごとに CSS 変数を書き換える。
2. Attack 新配色: 同様に「オレンジ寄りの黄色」。右下だけ濃色にするため、`.card-variant--attack-new :deep(.action-card)` に `background` を多層グラデーションで指定し、`background-blend-mode` または `::after` でアクセントを追加。
3. Status は before/after とも既存スタイルのままにし、比較のコントラストを明示。

### 6. 動作確認フロー
1. `pnpm run dev` でローカル起動し、`/lab/action-cards` へ遷移して CardList のスクロール/多段表示を確認。
2. Skill/Attack の配色が「before」と異なり、Status は共通であることを目視確認。
3. 既存ルート（特に `/battle`）で回帰がないことを軽く確認し、`ActionCard` に変更を加えていない点を再確認する。

## 決定事項
- **Library API**: View 向けに `CardInfo` まで整形する API（選択肢B）を採用し、`listActionCards()` を主エントリーポイントとする。
- **実験ページの表示枚数**: 代表的な少数カードに絞って一覧化（選択肢B）。タイプ毎に上限数を設けて視認性を確保する。
- **ルートパス**: `/lab/action-cards`（選択肢A）で追加し、ラボ系ルートの起点とする。
- **背景アクセント**: 既存背景に複数の `background-image`（linear/radial-gradient）を重ねて右下だけ色づかせる提案通りの方式を採用。
- **CardList の将来拡張**: 報酬選択 UI へ転用できるよう、hover/selection 用のクラス・イベント骨組みを今回の実装で先に用意する。
