# PlayerImageComponent 立ち絵クロップ・拡縮・はみ出し表示 計画

## 目的
- 800x1200 の元画像から指定領域（left 90px〜590px, top 144px〜bottom 1265px）を切り出し、255x665 に拡縮して表示する。
- 立ち絵が `.battle-sidebar` をはみ出して表示されるようにする。

## 実装方針
1. **クロップ領域の計算と適用**
   - 切り出し領域: x=90〜590 → 幅500px、y=144〜1265 → 高さ1121px（*元画像 1200px 高と整合しないため要確認*）。
   - 拡縮係数: 横 255/500 ≒ 0.51、縦 665/1121 ≒ 0.594。縦横スケール差があるため、保持したい比率を確認しつつ `transform: scale()` で別々に指定する。
   - 実装案: `.player-image__img` を absolute 配置し、`width: 800px; height: 1200px; transform: translate(-90px, -144px) scale(0.51, 0.594); transform-origin: top left; object-fit: none; object-position: top left;` などで矩形を合わせる。
2. **表示サイズ/オーバーフロー**
   - 表示枠（新ラッパー `.player-image__frame`）に `width: 255px; height: 665px; position: absolute; overflow: visible;` を設定し、`.battle-sidebar` の `overflow` を `visible` に変更してはみ出しを許容。
   - 既存の背景演出（選択中テーマ色）は `.player-image` ラッパーで維持しつつ、ラッパー自身も `overflow: visible` にしてクリッピングを解除。
3. **安全性/リグレッション対策**
   - `PlayerImageComponent` 内だけで完結するようにし、BattleView 側は基本変更を避ける。`.battle-sidebar` の overflow を `visible` に変更する際、隣接要素と重ならないよう z-index を軽く調整する。
   - 画像読み込み・プリロードロジックは既存のまま維持し、スタイル変更のみで完結させる。

## 確定事項（ユーザー回答反映）
- 有効高さは 1200px を基準とする（bottom=1200px とみなす）。
- 縦横は短辺基準の等倍スケールで拡縮する。
- はみ出し方向は右方向へ出す。

## 不明点・要確認
- なし（上記回答で解消）。追加の見た目指定があれば教えてください。
