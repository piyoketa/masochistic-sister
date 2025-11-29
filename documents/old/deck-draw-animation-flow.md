---
title: DeckDraw Animation Flow
updated: 2025-11-16
---

## 概要
`ViewManager` が `deck-draw` ステージを含むエントリを受け取ってから、`BattleHandArea` でドロー演出が走るまでの主要処理を時系列で整理する。

1. **ActionLog エントリ生成 (`OperationRunner.appendEntry`)**
   - `Battle.playCard` 等の実行後、`OperationRunner` が `BattleActionLogEntry` に `animationBatches` と `BattleSnapshotPatch` を添付する。
   - `deck-draw` ステージを含むバッチでは `patch.changes.hand` にドロー後の手札が格納される。

2. **ViewManager がエントリ受理 (`ViewManager.handleRunnerEntryAppended`)**
   - `ActionLogReplayer` の結果から `ResolvedBattleActionLogEntry` を構築し、`buildAnimationScriptFromEntry` を呼び出す。
   - Script には `apply-patch` → `stage-event`（`deck-draw`）→ `wait` → `update-snapshot` の順で `AnimationCommand` が積まれる。

3. **AnimationScript キュー投入 (`ViewManager.enqueueAnimation`)**
   - Script が再生キューに入り、`startNextAnimation` が `playback.current` をセット。
   - `animation-start` イベントで `BattleView` 側に通知される。

4. **Patch 適用 (`ViewManager.applyAnimationCommand`)**
   - `apply-patch` コマンドで `stateValue.snapshot` の `hand/deck/...` を差分更新。
   - この時点で `BattleHandArea` の props.snapshot.hand にドロー済みカードが反映される。

5. **StageEvent 発火 (`BattleView.runAnimation → emitStageEvent`)**
   - `stage-event` コマンドを受けた `BattleView` が `stageEvent` prop を更新し、`BattleHandArea` へ伝達。
   - ログ出力例: `ViewManager.ts:968`（エントリ再生開始）→ `BattleView.vue:459`（stage 指示開始）。

6. **手札コンポーネント側の処理 (`BattleHandArea.vue`)**
   - `useHandStageEvents` が `stageEvent` を監視し、`stage === 'deck-draw'` を検出。
   - 受信時点で `snapshot.hand` にカードが存在しなければ `pendingDeckAnimations` に登録。存在すれば即時 `startDeckDrawAnimation` を呼ぶ。
   - `snapshot` の hand 監視 (`previousHandIds` vs 現在) により DOM 追加タイミングで pending を消化。

7. **アニメーション実行 (`useHandAnimations.startDeckDrawAnimation`)**
   - `registerCardElement` が保持しているカード DOM (`cardElement`) と `deckCounterRef` を取得。
   - `applyDrawTransform` が `translate3d` + `scale` + `opacity` を設定し、`requestAnimationFrame` でアニメーション開始。
   - 失敗した場合は最大 3 回リトライ。

8. **完了処理**
   - `wait` コマンドで所定時間経過後、`update-snapshot` で `postEntrySnapshot` に同期。
   - `ViewManager` が `animation-complete` を通知し、次の Script へ進む。

## 参考ログ粒度
| ログ | 役割 |
| --- | --- |
| `ViewManager.ts:968` | Script 開始/終了のトレース |
| `BattleView.vue:459` | 各 StageEvent 指示 |
| `useHandStageEvents.ts` | StageEvent 受信・pending 状態 |
| `useHandAnimations.ts` | 実際の DOM transform 実行 |

これにより、`deck-draw` アニメーションが発火しない場合も「Patch 適用前の snapshot が参照されていないか」「pending キューが消化されていないか」などボトルネックが特定しやすくなる。
