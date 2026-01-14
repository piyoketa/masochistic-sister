## 目的
腐食の効果量を「1点=+1ダメージ」へ変更し、付与量や表示（「状態異常名 X点」表記）を実装・テストに反映する。

## 対応方針
- 腐食の基礎仕様変更
  - `CorrosionState` の倍率を 1 点=+1 ダメージにする。
  - `AcidSpitAction` など腐食付与元のスタック量を 1→10 に増量し、説明文も「腐食10点」へ更新。
- 表示仕様
  - 状態異常ラベルは「名称 X点」表記に統一する（括弧なし）。既存の括弧付き表記を置き換える。
  - `CorrosionState.description` は `<magnitude>` タグで強調表示する（DescriptionOverlay で色付け）。
- テスト・フィクスチャ更新
  - `tests/domain/attackDamages.spec.ts`: 腐食1点=+1 の新仕様で期待ダメージを再計算。現行で腐食1点を前提にしているケースは初期条件を腐食10点へ調整済みとのことなので、その前提で期待値を更新。
  - `tests/fixtures/battleSampleExpectedActionLog.ts` などのフィクスチャで「被ダメージ+10」表記や腐食スタック量を新仕様の初期値（腐食10点）に合わせて差し替え。
  - 状態異常ラベル表記変更に伴う表示系テスト（CardInfo/EnemyActionChip/手札表示）も期待値を「名称 X点」に統一。
- スタイル対応
  - `<magnitude>` タグの文字色を DescriptionOverlay で緑系に指定（`v-html` 表示を許可するためのサニタイズ方針を確認し、最小限のスパン変換か scoped スタイルで対応）。

## タスク
1. 腐食仕様変更の実装
   - `CorrosionState.modifyPreHit` の倍率を 1 に固定し、コンストラクタ初期値を確認。
   - `AcidSpitAction` の付与スタックを 10 に上げ、説明文を「腐食(10)」→「腐食10」に変更。
   - 状態異常ラベル生成ロジックを「名称 X点」表記へ統一（手札表示・敵行動チップなど）。
2. 表示強調の実装
   - `CorrosionState.description` に `<magnitude>` タグを付与。
   - DescriptionOverlay で `<magnitude>` を緑色にするスタイルを追加（スパン変換 or `v-html` + scoped CSS）。
3. テスト・フィクスチャ更新
   - `tests/domain/attackDamages.spec.ts` 期待値を新仕様で再計算し反映。
   - `tests/fixtures/battleSampleExpectedActionLog.ts` などで腐食関連の数値・表記を更新。
   - 表示系テストの期待ラベルを「名称 X点」に揃える。

## 不明点・確認事項
1. DescriptionOverlay の HTML 許可範囲  
   - 選択肢: A) `<magnitude>` を `<span class="text-magnitude">` に変換して `v-html`（CSSで色付け） / B) 文字列置換で `[]` など簡易マークアップに変更。  
   - おすすめ: A（既存 overlay を軽微に拡張し、他の強調表現にも流用可能）。
2. 腐食以外の状態異常ラベルへの波及範囲  
   - 選択肢: A) 全スタック型 State を「名称 X点」へ揃える / B) 腐食のみ先行変更。  
   - おすすめ: A（表記揺れを防ぎ、今後のテストも一貫）。  
3. 既存フィクスチャの精度  
   - バトルログの数値（被ダメージ+10など）をすべて再計算する必要があるか。  
   - おすすめ: 新仕様で実行し直し、差分を確認したうえで最小限の修正に留める。

この計画で進めて問題ないか、特に不明点1の HTML 取り扱い方針についてご指示ください。***
