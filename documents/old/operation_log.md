# OperationLog を ViewManager/フロントへ統合するための設計メモ

## 1. ゴール
- View ↔ Battle 間の通信ペイロードを ActionLogEntry ベースから OperationLogEntry（`play-card` / `end-player-turn`）ベースへ変更し、**プレイヤー操作単位**で履歴管理できるようにする。
- OperationRunner を UI 側でも利用し、敵行動や state-event、勝敗エントリを Battle が毎回演算して ActionLog に落とし込む流れを統一する。
- `retry` / `undo`（一手戻す）がプレイヤー操作単位で確実に巻き戻せるようにし、敵行動の再計算や乱数差異が発生しない構造にする。

## 2. 現状の課題整理
1. **ActionLog 直書き構造**  
   - `ViewManager` が `BattleActionLogEntry` を直接生成して push しており、敵行動ログや state-event がテスト用固定値になっている。
2. **Undo/Redo の粒度不整合**  
   - `playerActionHistory` は ActionLogIndex を記録しているため、複数エントリを生成する操作（例：`end-player-turn` → enemy-act 群）が「1 手」扱いにならない。
3. **ドロー数の責務が曖昧**  
   - UI 側がターン開始時 draw を推定し `start-player-turn` に `draw` 値を入れているが、今後は Model が一意に決めたい。
4. **乱数・敵行動の巻き戻し不可**  
   - `retry` や `undo` 時に敵行動キューや deck order が初期状態とズレる問題が残っている。

## 3. 目指す構造
```
UI (OperationLogEntry) ──> ViewManager OperationRunner ──> Battle / ActionLog
                                         │
                                         ├─ ActionLog (for replay / animation)
                                         └─ Snapshot (BattleSnapshot + EnemyQueue)
```

## 4. 実装方針
### 4.1 OperationLog を UI が管理
- `ViewManager` は `operationLog: OperationLog` を保持し、プレイヤー入力を OperationLogEntry として push。`OperationRunner` を通じて ActionLog を生成し、Battle を進行させる。
- `PlayerInput` 型も `play-card` / `end-player-turn` に限定した構造へ整理し、OperationLogEntry と 1:1 対応させる。

### 4.2 Battle 側の責務
- **初期盤面 Snapshot**  
  - OperationLogReplayer の「1 行目」として初期 Snapshot を保存する。Snapshot には Deck/Discard/Hand だけでなく、Enemy action queue / RNG シード / イベントキューも含め、巻き戻し時に完全再現できるようにする。
  - `Battle` に `captureInitialSnapshot()` / `restoreSnapshot(snapshot)` を追加し、ViewManager が `retry` 時に同じ状態を得られるようにする。
- **ドロー処理**  
  - バトル開始時に手札 3 枚で開始。これは `battle-start` の処理内でセットアップする。  
  - ターン開始時のドローは常に 2 枚固定。Model 側が `start-player-turn` エントリ生成時に `draw: 2` をセットし、UI は draw 数に関与しない。
- **OperationRunner の拡張**  
  - `initializeIfNeeded` 時に「初期 Snapshot を ActionLog へ埋め込む」仕組みを追加（OperationLogReplayer で snapshot を引き回す）。  
  - `endPlayerTurn()` が `enemy-act` / `player-event` / `state-event` を自動生成する現行仕様を踏襲しつつ、UI へ通知するための hook (`onEntryAppended`) を ViewManager へ渡す。

### 4.3 ViewManager の再設計
1. **OperationRunner 埋め込み**  
   - `ViewManager` 初期化時に `OperationRunner` を生成。`appendOperationEntry` で OperationLogEntry を push しつつ OperationRunner に反映、ActionLog 更新後の `BattleSnapshot` を保存する。
2. **アニメーション/入力ロック**  
   - `onEntryAppended`（OperationRunner）を通じて新 ActionLogEntry が生成されるたびにアニメーションキューへ積む。ActionLog を直接触る箇所（`appendActionLogEntry`）を全て OperationRunner 呼び出しに置換。
3. **Undo/Redo / Retry**  
   - Undo: OperationLog の末尾を truncate し、OperationRunner を新規 Battle へ再適用。ActionLogIndex ではなく OperationLogIndex で履歴管理。  
   - Retry: 初期 Snapshot（OperationLogReplayer が持つ 0 行目）より前には戻せないよう ViewManager 側で制限。
4. **テスト更新**  
   - `src/view/__tests__/ViewManager.spec.ts` / `src/views/__tests__/BattleView.spec.ts` は OperationLogEntry を前提にしたモックを組み直す。ActionLog 直書きのスタブは廃止し、OperationRunner の hook を使った挙動を検証する。

### 4.4 OperationLogReplayer / Snapshot の仕様
- `OperationLogReplayResult` に「初期 Snapshot（battle-start 前）」を含める。ViewManager Retry 時はこの Snapshot を使って Battle/OperationRunner を再初期化。
- Snapshot には以下を含める：
  - Player/Enemy/Deck/Hand/Discard/Exile
  - Enemy 行動キューの状態（`queuedActions` や random seed）
  - Event queue、pending state
- Snapshot から復元する API (`Battle.restoreSnapshot`) を実装し、OperationRunner が初期化時に利用できるようにする。

## 5. 実装計画（大枠）
1. **Battle / Snapshot 基盤拡張**  
   - `FullBattleSnapshot`（Deck/Hand/Discard/Exile + `rngSeed` + `enemyQueues`）を定義。  
   - `Battle.captureSnapshot()` / `restoreSnapshot()` を実装し、`ActionQueue` の serialize/deserialize API を整備。  
   - `Battle.initialize()` で初期手札 3 枚を配り、この状態を OperationRunner/OperationLogReplayer が初期 Snapshot として扱えるようにする。
2. **OperationRunner 強化**  
   - `onEntryAppended(entry, { waitMs, groupId })`・`onOperationApplied` hook を導入し、敵行動単位で待機情報を ViewManager へ伝える。  
   - Snapshot 初期化処理を取り込み、`battle-start` → `start-player-turn` 生成を自動化。  
   - `OperationRunnableError` を追加し、無効 Operation を UI へ伝播。
3. **ViewManager 再設計**  
   - OperationLog と OperationRunner を保持し、`queuePlayerAction` で OperationLogEntry を push → OperationRunner 経由で ActionLog を進行。  
   - Undo/Retry を OperationLogIndex & Snapshot ベースで実装し、初期 Snapshot 以前には戻れない制約を設ける。  
   - アニメーションキューは OperationRunner の待機情報に従い再生。
4. **BattleView / UI 改修**  
   - 入力を OperationLogEntry 形式へ統一（`play-card` / `end-player-turn`）。  
   - ActionLog 直接操作のコードを削除し、新しい ViewManager API に合わせる。  
   - BattleView / TitleView / デモ画面のテストを OperationLog 前提に書き直す。
5. **テスト & Fixture 更新**  
   - `battleSampleScenario*` などの fixture に FullBattleSnapshot を追加し、OperationLog → ActionLog → Snapshot 復元の整合性テストを拡充。  
   - ViewManager/BattleView の単体テストを OperationRunner モックで再構成。  
   - OperationLogReplayer のテストと `toJSON/fromJSON` 下地 API を追加（セーブ対応時に利用）。 

## 6. 決定事項と残タスク
1. **Snapshot フォーマット**  
   - 敵行動キューや RNG シードまで含む *完全シリアライズ* 方式を採用。`ActionQueue` の状態・乱数シード・イベントキュー・Deck/Hand/Discard/Exile/States などを丸ごと保存し、リプレイ／巻き戻し時に忠実に復元する。
2. **`battle-start` の責務**  
   - `Battle.initialize()` が初期デッキから手札 3 枚をドローし盤面をセットアップ。OperationRunner はこの Snapshot をそのまま採用し、`battle-start` エントリ作成後から OperationLog を処理する。
3. **アニメーション同期**  
   - OperationRunner が敵 1 体の行動など「エントリまとまり」毎に待機情報をまとめて渡し、ViewManager はその単位で再生する。`onEntryAppended` には entry + wait 情報を添付し、既存 AnimationScript の流れを踏襲する。
4. **OperationLog 永続化**  
   - 当面はメモリ運用のみ。将来セーブ/ロードが必要になった際に `OperationLog.toJSON()` / `.fromJSON()` を実装できるよう API だけ先行で設計する。
5. **OperationRunner のエラー伝播**  
   - 無効な OperationLogEntry を検知したら `OperationRunnableError` を throw。ViewManager がキャッチして `emit({ type: 'error', ... })` で UI へ通知し、入力キューを停止させる。

現時点の不明点:
- Snapshot に含める Enemy 行動キューの具体的なシリアライズ形式（ActionQueue の API 仕様）がまだ未定。実装前に `ActionQueue` 側の serialize/deserialize 仕様を決める必要がある。
- OperationRunner が ViewManager へ渡す「待機情報」フォーマット（例: `waitMs`、`groupId`）を詳細設計する必要がある。
- OperationLog の `toJSON` / `fromJSON` API 仕様（特にカード ID や operation payload の表現）を詰める必要があるが、これはセーブ機能着手時に再検討予定。

上記について、特に 1,2,3,5 は要素実装前に詳細を詰める必要があります。Snapshot の形式や `battle-start` の責務など、仕様決定後に ViewManager 実装へ着手するのが安全です。***
