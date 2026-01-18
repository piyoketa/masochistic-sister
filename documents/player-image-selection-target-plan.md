# Player画像の背景色適用先変更 計画

## 目的
EnemyTargetOperation 中のプレイヤー画像の背景色強調を、現在の DOM から `.player-card__image` に移す。

## 現状把握
- 背景色強調の適用先は `PlayerImageComponent` のルート要素 `.player-image`。
- `PlayerImageComponent` 内で `selectionThemeActive` を算出し、`.player-image--selecting` クラスで背景色とシャドウを付与している。
- 背景色の色味は `SELECTION_THEME_COLORS` から CSS 変数 `--player-accent-*` として注入している。

## 変更方針
- 背景色強調の DOM 対象を `.player-card__image` に移す。
- `PlayerCardComponent` 側で `SELECTION_THEME_COLORS` を参照し、背景色用の CSS 変数を `.player-card__image` に付与する。
- `PlayerImageComponent` にあった背景色用の CSS と変数注入は不要になるため削除し、責務を「画像描画と差分合成」に集中させる。

## 作業手順
1. `PlayerImageComponent` の背景色強調の実装箇所（`.player-image--selecting` と `styleVars`）を特定し、削除対象を洗い出す。
2. `PlayerCardComponent` に `selectionTheme` ベースの `selectionThemeActive` と CSS 変数計算を追加し、`.player-card__image` に class/`style` を付与する。
3. `PlayerImageComponent` から背景色強調用の CSS と不要な計算（`styleVars`）を削除する。
4. 既存機能の影響確認:
   - 表情差分（selectionTheme）やダメージ差分が継続して描画されるか。
   - 既存の選択テーマの見た目に差分がないか。

## 確認観点（手動）
- 敵選択フェーズ中に `.player-card__image` がテーマ色で強調される。
- 敵選択終了後に強調が解除される。
- 表情差分やダメージ表現がこれまで通り表示される。

## 不明点・判断が必要な事項（決定済み）
1. `.player-card__image` の背景強調範囲: 選択肢A（`.player-card__image` 全体を強調）
2. `default` テーマ時の強調可否: 選択肢A（`selectionTheme !== 'default'` のときのみ強調）
3. `PlayerImageComponent` に背景色強調機能を残すか: 選択肢A（背景色強調関連は削除）

## 実装開始前の確認
- この計画書の内容で実装を進めて問題ないか確認してください。
