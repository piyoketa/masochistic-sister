# TargetEnemyOperation 選択演出・聖女立ち絵レイアウト改修 計画

## 目的
- TargetEnemyOperation 中にカード種別別のテーマ色を適用し、敵カード・選択中カード・聖女立ち絵背景の演出を統一する。
- BattleView のサイドバーとメイン領域を左右反転し、聖女立ち絵を専用コンポーネントへ分離、HP に応じて差し替え＆プリロードする。

## 方針サマリ
- テーマ色: ArcaneCardTag → `#d447b9`（ピンク寄り赤紫）、SacredCardTag → `#4fa6ff`（青）、その他 → 既存赤 (`#ff4d6d` / `rgba(255,116,116,…)`) を継続。枠・シャドウのみ変更。
- 適用範囲: 敵指定中（カード選択〜敵クリック完了まで）に限定し、敵カードと選択中手札カード、PlayerImageComponent 背景へ同一テーマ色を適用。
- レイアウト: BattleView 内の `aside.battle-sidebar` を左、`main.battle-main` を右へ移動。CSS/フレックスを整理し既存 UI を崩さない。
- 立ち絵: `PlayerImageComponent` を新設し、HP 以上で最も近い数値のファイル名を選ぶルールで画像を表示。`public/assets/players/*.png` をコンポーネントロード時にプリロードし再ロード防止。

## 作業ステップ
1) **API/データフロー拡張**
   - TargetEnemyOperation 開始時に、カードの `categoryTags` からテーマを決定する関数を追加（優先順位: Arcane > Sacred > その他）。
   - `requestEnemyTarget` のシグネチャを拡張し、テーマ情報を受け渡しできるよう BattleHandArea → BattleView → BattleEnemyArea に伝搬。
   - BattleView でテーマ状態を保持し、PlayerImageComponent にも伝える props を追加。
2) **UI コンポーネント対応**
   - `PlayerImageComponent` を新規作成（責務: 立ち絵表示/プリロード/背景色テーマ反映）。HP から表示ファイルを解決するロジックとプリロード処理を実装。
   - BattleView のテンプレートでサイドバーとメインの並びを左右反転し、立ち絵箇所を PlayerImageComponent に置き換え。
   - EnemyCard/ActionCard にテーマ色を適用するためのクラス or CSS 変数を追加し、TargetEnemyOperation 中のみ有効化。
3) **スタイル整理**
   - サイドバーの幅・余白・背景などフレックス変更に伴う崩れを調整。
   - 立ち絵背景色のテーマ連動（Arcane/Sacred/Default）の CSS を追加し、acting など他演出と干渉しないようクラス分離。
   - 既存赤系演出（acting: 黄系）は保持し、優先度を明確化。
4) **テスト/確認**
   - BattleView.spec のスタブ API 変更（requestEnemyTarget 引数など）を更新し、既存ケースを通す。
   - 手動確認: Arcane/Sacred/その他カードで敵指定開始→敵カード・手札枠・立ち絵背景がテーマ色に変わること、左右反転レイアウトが破綻しないことをブラウザで確認。

## 不明点・確認事項
- 現時点で追加の不明点なし。新規要望があれば反映可能。
