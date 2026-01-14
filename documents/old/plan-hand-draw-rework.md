## 目的
- 手札管理ルールを experimental（初期0枚、ターン開始4枚、ターン終了で状態異常以外を捨て札）に統一する。
- ActionLog に「ターン終了時の一括捨て札」演出を追加し、ログ再生とUI表示を同期させる。

## 現状の仕様と定義箇所
- 初期ドロー枚数: `Player.calculateInitialDraw` (`src/domain/entities/Player.ts`) で常に0枚（レリックによる加算なし）。
- ターン開始ドロー枚数: `OperationRunner.calculateTurnStartDraw` (`src/domain/battle/OperationRunner.ts`) で固定値 `4`。
- ターン終了時の手札処理: 常に状態異常以外を捨て札へ送る。`Battle.endPlayerTurn` 内で `discardNonStatusHandCards` を呼び出す。
- ActionLog のターン開始演出: `appendStartPlayerTurn` で `draw` フィールドを持つ `start-player-turn` エントリを追加。`ActionLog` の `animationBatches` で `deck-draw` ステージを生成。
- ActionLog の `end-player-turn` に `card-trash` ステージを含める（手札破棄の可視化）。

## 方針（現仕様）
- 手札ルールは experimental に固定し、classic 分岐や環境変数での切り替えは廃止する。
- ActionLog / AnimationInstruction では手札破棄を明示し、ログ再生で再現できる形を維持する。

## 実装タスク
1. **手札ルールの固定化**
   - classic 分岐・環境変数での切替を削除し、experimental 挙動をデフォルトとして維持する。
2. **初期ドローとターン開始ドロー**
   - 戦闘開始ドロー0枚・ターン開始ドロー4枚を前提にテスト/フィクスチャを更新する。
3. **ターン終了時の一括捨て札**
   - `end-player-turn` で常に状態異常以外を捨て札へ送り、ActionLog に `card-trash` を残す。
4. **アニメーション・ログ生成**
   - `ActionLog` / `OperationRunner` の `build...` 系メソッドで `end-player-turn` の `card-trash` を出力する処理を維持し、UI と同期する。
5. **テスト・フィクスチャ更新**
   - 手札破棄/ドロー仕様の変更を反映した ActionLog フィクスチャを再生成する（`LOG_BATTLE_SAMPLE*_SUMMARY` を利用）。

## 不明点・決定事項（提案）
- デフォルト: **experimental に統一**（classic はサポートしない）。
- 捨て札対象の判定: 「状態異常以外の手札」を `cardType !== 'status'` で判定する（カードタイトル依存を避ける）。
- アニメーション順序: マナ変化や敵行動との順序は現行の `end-player-turn` の後に `card-trash` をまとめて入れる（おすすめ: エントリ内で `card-trash` → その後のスナップショット）。
