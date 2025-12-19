## 目的
- 手札管理ルールを実験できるようにし、現行仕様（初期3枚、ターン開始2枚、手札持ち越し）と新仕様（初期0枚、ターン開始4枚、ターン終了で状態異常以外を捨て札）をフラグで切り替えられるようにする。
- ActionLog に「ターン終了時の一括捨て札」演出を追加し、ログ再生とUI表示を同期させる。

## 現状の仕様と定義箇所
- 初期ドロー枚数: `Player.calculateInitialDraw` (`src/domain/entities/Player.ts:278`) でデフォルト3枚、レリックで+1。
- ターン開始ドロー枚数: `OperationRunner.calculateTurnStartDraw` (`src/domain/battle/OperationRunner.ts:1445`) で固定値 `2`。
- ターン終了時の手札処理: 現状は持ち越し。`OperationRunner.endPlayerTurn` → `Battle` では手札破棄なし。
- ActionLog のターン開始演出: `appendStartPlayerTurn` で `draw` フィールドを持つ `start-player-turn` エントリを追加。`ActionLog` の `animationBatches` で `deck-draw` ステージを生成。
- ActionLog の `end-player-turn` には現状 `card-trash` ステージなし。

## 方針（フラグ切り替え）
- `HandRuleVariant` のような設定フラグを `OperationRunner` / `Battle` に渡せるようにする。デフォルトは現行仕様（`classic`）、実験用に `experimental` を追加。
  - `classic`: 既存挙動（初期3+α / ターン開始2 / 持ち越し）。
  - `experimental`: 初期0 / ターン開始4 / ターン終了で状態異常以外を捨て札。
- フラグの入口案: 
  - 簡易: `OperationRunnerConfig` にオプションを追加し、`createBattle` で同じフラグを受け取る。
  - または dev 用に `scripts/devWithEnv.mjs` へ環境変数 `EXPERIMENT_HAND_RULE=1` を追加して DI。
  - **おすすめ**: `OperationRunnerConfig.handRuleVariant` を追加（テストも注入しやすい）＋ dev 環境では環境変数で experimental を選べるようにする。

## 実装タスク
1. **設定フラグの導入**
   - `OperationRunnerConfig` に `handRuleVariant: 'classic' | 'experimental'` を追加（デフォルト `'classic'`）。
   - `Battle` 生成部（既存の `createBattle` 呼び出し箇所／DI）でフラグを受け取り、`Battle` 内に保持させる（必要ならコンストラクタ引数拡張）。
2. **初期ドローとターン開始ドローの分岐**
   - `Player.calculateInitialDraw`: `handRuleVariant` が `experimental` のとき 0 を返す。
   - `OperationRunner.calculateTurnStartDraw`: `experimental` のとき 4、それ以外は 2。
3. **ターン終了時の一括捨て札（experimental のみ）**
   - `OperationRunner.endPlayerTurn` 直後（または `Battle` 側のターンエンド処理）で、手札から状態異常以外のカードを全て捨て札へ移動するメソッドを追加。
   - 捨て札イベントを `Battle` の `pendingCardTrashAnimationEvents`（既存）に積む、もしくは新規で `card-trash` ステージを生成する。
   - ActionLogEntrySummary `end-player-turn` に `animationBatches` を付与し、`card-trash` ステージで対象カードID/タイトルを流す。
4. **アニメーション・ログ生成**
   - `ActionLog` / `OperationRunner` の `build...` 系メソッドで `end-player-turn` の `card-trash` を出力する処理を追加。
   - UI 側で `card-trash` が無くても動く既存ロジックに影響しないように、空の場合はスキップ。
5. **テスト・フィクスチャ更新**
   - 新フラグの単体テスト: 初期ドロー0・ターン開始4・ターンエンド捨て札を確認する。
   - ActionLog フィクスチャに `end-player-turn` の `card-trash` ステージが出ることを確認する（必要なら `LOG_BATTLE_SAMPLE*_SUMMARY` で再生成）。
   - 旧仕様（classic）にも後方互換が保たれていることを確認。

## 不明点・決定事項（提案）
- フラグのデフォルト: **classic を維持**（おすすめ、既存シナリオへの影響を避ける）。
- フラグの切替方法: **OperationRunnerConfig 経由で必ず指定**し、開発環境では環境変数 `EXPERIMENT_HAND_RULE=1` で experimental を有効化するのが簡便。
- 捨て札対象の判定: 「状態異常以外の手札」を `cardType !== 'status'` で判定する（カードタイトル依存を避ける）。
- アニメーション順序: マナ変化や敵行動との順序は現行の `end-player-turn` の後に `card-trash` をまとめて入れる（おすすめ: エントリ内で `card-trash` → その後のスナップショット）。
