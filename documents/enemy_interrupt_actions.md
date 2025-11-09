# プレイヤーターン中の敵割り込み行動設計メモ

## 目的
プレイヤーのメインフェイズ中に敵が割り込んで行動するギミック（被虐のオーラ、敵のトラップ、状態異常による自動発動など）を安全に挿入できるよう、Battle / OperationRunner / ViewManager を横断する設計方針を定義する。

## 用語整理
- **割り込み敵行動 (Interrupt Enemy Action)**  
  プレイヤー操作の途中（カード効果処理、イベント解決中など）に即時で挿入される敵行動。  
- **Interrupt Queue**  
  割り込み行動を時系列で蓄積するバッファ。Battle が保持し、OperationRunner が ActionLog エントリへ変換する。  
- **Snapshot Boundary**  
  割り込み行動が始まる直前の盤面スナップショット。ActionLog エントリごとの再生を破綻させないため、Battle が `markEntrySnapshotBoundary()` で保存する。

## 要件
1. **ActionLog の順序保証**  
   プレイヤー操作 (`play-card`) → その効果による割り込み敵行動 (`enemy-act`) の順で ActionLog に積む。  
2. **盤面同期**  
   `play-card` エントリのアニメーション中は “カード使用後・敵行動前” の状態を保持し、敵行動は後続エントリの再生まで反映しない。  
3. **複数回割り込み**  
   1 つのプレイヤー操作中に敵が複数回行動するケース（例: トラップ連鎖）でも順番どおり ActionLog へ出力できる。  
4. **Undo/Retry 互換**  
   OperationLog の巻き戻し時に Battle を再構築すると、割り込みが発生した箇所も同じ順序で再生される。

## 想定API
### Battle
- `queueInterruptEnemyAction(enemyId: number, options?: QueueOptions)`  
  敵 ID・追加メタ情報を受け取り、`interruptEnemyActionQueue` に「まだ実行していない行動予約」を積む。  
  - `QueueOptions`: `{ immediate?: boolean; snapshot?: BattleSnapshot; trigger?: 'card' | 'state' | 'trap' }`
- `consumeInterruptEnemyActions(): PendingEnemyAction[]`  
  OperationRunner が呼び出し、必要に応じて実際の `performEnemyAction` をここで実行→ `EnemyTurnActionSummary` を返す。
- `markEntrySnapshotBoundary(snapshot?: BattleSnapshot)`  
  既存 API を活用し、割り込みが始まる直前の状態を保存する。

### OperationRunner
- `appendInterruptActions()`  
  `battle.consumeInterruptEnemyActions()` を呼び出し、得られたサマリを `pendingEnemyActSummaries` へ push → ActionLog に `enemy-act` を追加。
- `flushResolvedEvents()` や `appendEntry()` 実行後に常に `appendInterruptActions()` を挟み、どのフェーズでも割り込みを ActionLog 化できるようにする。
- **プレイヤー操作受付前の強制チェック**  
  入力ロックを解除してユーザー操作を再開する直前（例: `ViewManager` が `setInputLock(false)` を発行するタイミング）に OperationRunner 側で `appendInterruptActions()` を再度呼び、割り込みキューが空であることを保証する。これにより、プレイヤーが次の行動を取れる状態になった瞬間に潜在的な敵行動が残っている、という事態を防ぐ。

## 処理フロー例（被虐のオーラ）
1. `MasochisticAuraAction.perform()`:
   1. `battle.markEntrySnapshotBoundary()` でカード効果終了時の盤面を保存。
   2. `battle.queueInterruptEnemyAction(targetId, { trigger: 'card' })` を呼ぶ（この時点では敵行動を実行しない）。
2. `OperationRunner.appendEntry(play-card)`:
   1. `appendEntry` → `appendInterruptActions()` が呼ばれ、Battle から割り込みキューを取得。
   2. Battle は `performEnemyAction` をここで実行し、`EnemyTurnActionSummary` と `snapshotAfter` を返す。
   3. OperationRunner はサマリを `pendingEnemyActSummaries` に積み、ActionLog へ `enemy-act` を追記。
3. ViewManager:
   1. `play-card` のアニメ再生では boundary snapshot を用い、敵行動後の状態をまだ反映しない。
   2. 次の `enemy-act` エントリ再生時に、初めて敵行動後の `postEntrySnapshot` を反映。

## 今後想定される拡張
- **条件付きトリガー**  
  敵ステート（例: 「臆病」）や手札の状況に応じて `queueInterruptEnemyAction` を自動実行する。
- **複合演出**  
  プレイヤー行動と敵割り込みが同時にアニメ再生されるケースでは、`batchId` を共有しつつ Stage イベントを分解する。
- **ログ可視化**  
  UI で「どのプレイヤー操作が敵割り込みを誘発したか」を示すため、ActionLog エントリに `trigger` メタデータを保持。

## まとめ
割り込み行動を「即時実行→即時反映」ではなく「キューイング→ActionLog へ変換→順次再生」することで、盤面同期とアニメーション設計の整合性を担保できる。Battle は行動の真正な順序と Snapshot を管理し、OperationRunner は ActionLog を構築、ViewManager はステージ演出を制御するという責務分割を守ることで、今後追加される特殊敵効果にも柔軟に対応できる。###
