---
title: アニメーション再設計計画（バッチ導入）
---

# 設計概要
- **バッチ型アニメーションの導入**: `BattleActionLogEntry.animationBatches`（`{ batchId, snapshot, instructions: AnimationInstruction[] }`）を基準にし、同一バッチ内の指示は同一 snapshot と `batchId` を共有して同時再生される。`AnimationInstruction` は `waitMs` と `metadata` を持ち、View は各バッチの最大 `waitMs` を待って次バッチへ進む。`BattleView` / `ViewManager` はバッチの進行管理（現在のバッチ、次バッチ、max wait）に責務を持つ。
- **新しい stage 種別**  
  - `create-state-card`（プレイヤーが状態異常を得た際に発生、`waitMs = 500ms`、敵アクションバッチ内）。  
  - `memory-card`（`Player.rememberEnemyAttack` 時の記憶カード生成、`waitMs = 1500ms`、敵の `enemy-action-batch` 終了後に `remember-enemy-attack-batch` を追加）。  
  - `audio`（効果音再生向け、`waitMs = 500ms`、`Action` に `soundId` がある場合に生成）。  
- **バッチ構成の例**  
  - `enemy-act`（溶かす）:  
    1. `enemy-act-start-batch`: `enemy-highlight`（`waitMs=0`）。  
    2. `enemy-action-batch`: `player-damage`（`waitMs=(count-1)*200+500`）、`create-state-card`（`waitMs=500`）。  
    3. `remember-enemy-attack-batch`: `memory-card`（`waitMs=1500`）。  
  - `play-card`（天の鎖）: 単一バッチ `play-card` に mana（0.3s）、card-eliminate（720ms）、音声（0.5s）をまとめる。  
  - `play-card`（乱れ突き 10×3）: 同一バッチに mana（0.3s）、card-trash（300ms）、damage（`(count-1)*0.2+0.5`）を含める。  
- **OperationRunner/Battle の役割整理**:  
  - `OperationRunner` は `EnemyTurnActionSummary` / `PlayCard` 時に `AnimationBatch` を構築し、各 batch に snapshot と `AnimationInstruction`（`metadata`, `damageOutcomes`, `batchId` など）を添付。`create-state-card` は `Player.addState` 周りで metadata を注入し、`memory-card` は `Player.rememberEnemyAttack` の結果で発火する。  
  - `Battle` 側は `EnemyTurnActionSummary` に `snapshotAfter` を含めつつ `AnimationBatch` への参照 metadata を整理、`Player` からの state/memory イベントを `OperationRunner` に伝搬する。  
- **View 側の再生制御**:  
  - `BattleView` は `ViewManager` から送られる `AnimationScript` をバッチに分割し、各 batch の completion（`max waitMs` + commands）で次 batch を再生。  
  - `StageEventPayload` は `batchId`・`metadata`（`create-state-card`/`memory-card`/`audio`）・`resolvedEntry` を保持し、`BattleEnemyArea`/`useHandStageEvents` などが `batchId` ごとに throttled に処理する。  
  - `useHandAnimations` は `card-*` stage で待機時間を `AnimationBatch` の `waitMs` から取得し、`card-eliminate` (720ms)/`card-trash` (300ms) を反映。`useHandStageEvents` では `create-state-card` vs `memory-card` で別のアニメーションパスを用意。  
- **音声コンポーネント**: stage `audio` を受け取る `DamageEffects` などのスケルトン（`SoundPlayer`）を導入し、`battle` のアクションで発生した `soundId` を再生。  
- **ドキュメント更新**: 整理したバッチ構成、wait 値、stage 名は `documents/animation_instruction.md` に追記して共有する。
### 型変更ポイント（予定）
1. `AnimationInstruction` に `batchId`（string）、`metadata`（`AnimationStageMetadata` の拡張）、`waitMs` を保持。  
2. `BattleActionLogEntry` から `animations?: AnimationInstruction[]` を廃止し、`AnimationBatch[]` を保持。バッチの `snapshot` は `BattleSnapshot`、`instructions` は `AnimationInstruction[]`。  
3. `StageEventPayload` に `batchId` を追加し、`resolvedEntry` は `AnimationBatch` の `resolvedEntry` に基づいた `ResolvedBattleActionLogEntry`。新 stage を型に追加。  
4. `OperationRunner` の `attachEnemyActAnimations`/`buildPlayCardAnimations` をリファクタし、複数バッチを生成する helper を導入。  
5. `Player` の `addState`/`rememberEnemyAttack` に `AnimationBatch` 用メタ情報（state id / source action）を付加し、`Battle` や `OperationRunner` が利用。
+6. `BattleView` / `ViewManager` が `AnimationScript` をバッチベースで再生し、`AnimationCommand` に `batchId` を含める。
+7. `useHandStageEvents` / `BattleEnemyArea` などが `batchId` をもとに `processedStageBatchIds` を管理し、`memory-card` / `audio` を処理。
+
+# 影響を受けるテストと対応方針
1. `tests/domain/battle/operationRunnerInstructions.spec.ts`, `tests/domain/battle/operationRunner.spec.ts`  
   - `AnimationBatch[]` への変更と `create-state-card` / `memory-card` / `audio` stage の `metadata` 追加に伴い、期待値をバッチ構造に合わせて更新。`waitMs` はバッチの最大値をチェックし、`snapshot` が `BattleSnapshot` であることも検証。  
2. `tests/components/BattleHandArea.spec.ts`, `tests/components/BattleEnemyArea.spec.ts`  
   - `StageEventMetadata.stage` に `create-state-card` / `memory-card` / `audio` を追加し、バッチ `batchId` の固定値・`waitMs` を含めたケースを再現。不要な stage 重複テストは削除可。ただし削除する場合はテスト名・内容・理由を一覧化し、確認を求める。  
3. `tests/views/BattleView.spec.ts` / `tests/view/ViewManager.spec.ts`  
   - `AnimationScript` の `commands` 生成に `batchId` を含めるため、これらの spec で `batchId` と `metadata.entryType` の一致を確認する helper を追加。`resolvedEntry` の更新タイミングもバッチ単位に変更。
+
+# 型エラー対応方針（改修前整理）
## 優先的に解消すべき型エラー（今回の設計に直結）
1. `tests/components/BattleHandArea.spec.ts` / `BattleEnemyArea.spec.ts` の `StageEventMetadata` で `skipped` / `cardIds` / `damage` などが不足している箇所。新 stage を追加する前に型定義をバッチ対応版へ直す必要あり。  
2. `tests/components/BattleHandArea.spec.ts` における `stage` プロパティの不正文字列。`StageEventMetadata` の union に合致する文字列（`create-state-card` 等）に調整してから改修。  
3. `tests/domain/battle/operationRunnerInstructions.spec.ts` で `animations` を単一配列として扱っている箇所。`AnimationBatch[]` に切り替えないとバッチ再生ロジックが破綻する。  
4. `CardDrawLabView` / `DamageEffectsDemoView` の DOM `ref` や `DamageOutcome.effectType` の型違反。フロント全体の type-check が通っていることが前提なので先に収束させておく。  
5. `BattleView.spec.ts` / `ViewManager.spec.ts` における `AnimationCommand` / `resolvedEntry` の null guard。バッチ導入後も `resolvedEntry` の参照が必要なため、ここを先行して整備。  
## 優先順位を下げられる型エラー（後回し可）  
1. `tests/domain/action/Attack.spec.ts` 等での `Duplicate identifier`。バッチ設計に無関係なので、`animation` 変更後にまとめて整理。  
2. `tests/domain/*` の `Object is possibly 'undefined'` 系（多くは `OperationRunner` テスト）。バッチ構造が安定したあとに再評価で十分。  
3. `BattleHandArea.spec.ts` の `createdWrapper` など `undefined` 可能性を `!` で一時抑える箇所。バッチ実装後にリファイン。
+
+# 次のステップ
1. 新しい `AnimationBatch` / stage を型定義に落とし込み、`OperationRunner` が複数バッチを出力する helper を実装。  
2. `BattleView`・`ViewManager` をバッチループ再生対応に変更し、`StageEvent` に `batchId` が含まれる形で `latestStageEvent` を更新。  
3. `useHandStageEvents` / `BattleHandArea` のテストを更新し、必要なら `memory-card` / `audio` stage に関する複数ケースを追加。  
4. 影響が大きいテスト（`operationRunnerInstructions.spec.ts`, `BattleHandArea.spec.ts`）の期待値を更新し、削除候補が出たら一覧と理由を共有。  
5. `documents/animation_instruction.md` を改訂し、enemy-act / play-card / `audio` / `memory-card` バッチ構成と `waitMs` を記載。*** 
