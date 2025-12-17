# プレイヤーHP予測を OperationRunner 経由で再計算する計画

## 目的
- `Battle.predictPlayerHpAfterEndTurn` の計算を、実際の敵行動を含めたシミュレーション結果に置き換える。
- 現在は `Battle.endPlayerTurn()` を直接呼んでいるため、敵行動が実行されず正しい予測にならない。
- 「一手戻す」と同様に、`OperationRunner` で初期状態からログを適用したクローンを作り、その上で疑似的に `end-player-turn` を 1 回だけ追加適用し、得られた HP を予測値として返す。

## 方針
1. **リプレイ専用ランナーを生成してシミュレート**
   - 現在の `OperationRunner` が持つ `initialSnapshot` と `operationLog`（実行済み分）を元に、新しい `OperationRunner` を生成。
   - そのランナーに対し、通常の再生手順と同じく `initializeIfNeeded()`→既存ログの再適用→疑似エントリとして `end-player-turn` を追加で実行。
   - 追加実行後の `Battle` 状態からプレイヤー HP を取得し、予測値として返す。
   - 元のランナー／バトルには一切副作用を与えない。

2. **共通ヘルパーを用意**
   - `OperationRunner` に「指定した操作ログでバトルを再構築し、任意の追加操作を実行してスナップショットを返す」ユーティリティを追加する。
- 予測専用のケースでは「追加操作 = end-player-turn のみ」を渡す。
- 失敗時は警告ログを出し `undefined` を返す。

### 追加の調査ログ
- Battle.predictPlayerHpAfterEndTurn 入口/デリゲート結果を console.debug で出力。
- OperationRunner.simulateEndTurnPrediction で再生開始/終了時の HP・ターン・ログ長を出力。
- BattleView 側でスナップショットの predictedPlayerHpAfterEndTurn を console.debug で出力。

3. **Battle 側の予測ロジックを差し替え**
   - `Battle.predictPlayerHpAfterEndTurn` から上記ヘルパーを呼び、返却値に置き換える。
   - 敵ターン中のキャッシュ再利用 (`cachedPredictedPlayerHpAfterEndTurn`) の扱いは従来通り。

4. **整合性とパフォーマンス**
   - 1回の予測で「全ログの再生 + end-player-turn 1回」になる。負荷が大きい場合はキャッシュや軽量ランナー化を検討するが、まずは正しさ重視で実装。
   - 予測用ランナーには `onEntryAppended` を渡さず、アニメーション構築等はスキップする。

## 修正対象
- `src/domain/battle/Battle.ts`
  - `predictPlayerHpAfterEndTurn` をリプレイベースに差し替え。
  - 予測失敗時のフォールバックは `undefined`（従来挙動）を維持。
- `src/domain/battle/OperationRunner.ts`
  - 「初期スナップショットとログから新しいランナーを生成し、任意の追加操作を適用してスナップショットを返す」ヘルパーを追加。
  - 予測用は `end-player-turn` を 1 回だけ追加するユーティリティを用意。

## 不明点・要確認
1. **追加操作の扱い**
   - 選択肢: `end-player-turn` 以外も将来使う汎用ヘルパーにする / 予測専用に絞る。
   - おすすめ: 汎用ヘルパーとして実装（追加操作の配列を受け取り適用）。今回の用途は `end-player-turn` のみを渡す。
2. **キャッシュ戦略**
   - 選択肢: 毎回リプレイ / 直近結果をキャッシュ / 敵ターン中のみキャッシュ。
   - おすすめ: まずは毎回リプレイで正しさを担保し、必要なら後でキャッシュを検討。
3. **アニメーション・ログ生成**
   - 選択肢: 予測ランナーでアニメーション組み立てを行う / スキップする。
   - おすすめ: 予測は状態のみ必要なので、`onEntryAppended` なしでアニメーション構築をスキップする。

上記で問題なければ実装に着手します。***
