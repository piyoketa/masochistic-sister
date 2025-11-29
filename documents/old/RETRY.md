戦闘画面の「戦闘開始からやり直す」「一手戻す」機能を安定させるためのメモ。

# 既知の課題
- **いつでも押せてしまう**：既に初期状態に戻っていてもリトライ/アンドゥボタンが活性のまま。
- **初期状態が変わる**：リトライ時に敵行動キューやデッキシャッフルが再度乱数を消費し、毎回挙動が変わる。
- **アニメーション結果がぶれる**：途中で undo/redo を挟むと、ActionLog/AnimationInstruction の整合が崩れて DOM と演出が再現できないことがある。

# アニメーションが変わってしまう主因
1. **乱数の再評価**：Battle を作り直すたびに敵行動キューとプレイヤーデッキが別の並びになる。
2. **OperationLog と ActionLog のズレ**：OperationRunner を途中から実行すると `enemy-act` や `state-event` の派生結果が元の ActionLog と一致しない。
3. **UI の一時状態が残る**：`BattleHandArea` / `BattleEnemyArea` が `processedStageBatchIds` や hover 情報を内部に保持しており、Snapshot を差し替えても DOM が再構築されない。
4. **未クリアのアニメーションキュー**：実行途中の `AnimationScript` が残ったままリトライすると、ViewManager が過去の `stage-event` を再生してしまう。

# 新方針の概要
## 1. 初期 FullBattleSnapshot の固定
- 最初に OperationRunner を生成した瞬間の `FullBattleSnapshot` を保持し、以降は `Battle` を新しく作るたびに `restoreFullSnapshot` でその状態を復元する。
- Snapshot には敵行動キュー (`enemyQueues`) も含めて保存する。`structuredClone` 相当の深いコピーを使い、Battle 側の操作で初期値が破壊されないようにする。

## 2. OperationLog の再適用で状態再現
- リトライ/アンドゥでは OperationLog を truncate した上で **必ず先頭から** 再適用する。`executedOperationIndex` を更新し、`canRetry()`/`hasUndoableAction()` が正しい値を返すようにする。
- ActionLog と AnimationInstruction は OperationRunner が毎回組み立て直すため、保存済みログとの差異が出ない。

## 3. UI 状態のリセット
- ViewManager がスナップショットを差し替えた直後に `BattleView` 側で hover / selection / footer などの一時状態をクリアし、`key` を変えることで `BattleHandArea` / `BattleEnemyArea` / `DamageEffects` を再マウントする。
- これにより `processedStageBatchIds` や手札アニメーションの queues が初期化され、Snapshot から deterministically 同じ DOM が生成される。

## 4. イベントフック／今後の拡張
- 現段階では **ユーザー操作 (= OperationLog)** 単位の巻き戻しのみを扱う。敵割り込みやイベントフックとの整合は、将来的に必要になった段階で改めて検討する。
- 最悪でも「初期 Snapshot + OperationLog 全再生」で盤面を復元できるため、現状は深追いしない。

# 懸念と解決策
## メモリ負荷（問題度: 低）
- 1 スナップショットはシナリオ規模でも数 KB。OperationLog が 50 手あっても数百 KB 程度なので、ブラウザ/テストいずれも許容範囲。
- `FullBattleSnapshot` は `cloneBattleSnapshot` / `cloneFullSnapshot` でディープコピーし、Battle 内部での変更が共有参照を壊さないようにする。

## パフォーマンス（問題度: 中）
- ログ全再生は O(n) だが n ≦ 50 の想定。ViewManager 側で `suspendRunnerEvents` を使って再生中のアニメーションを抑止し、UI 更新は `syncStateFromBattle()` の 1 回にまとめる。
- 必要なら OperationRunner に `operationIndex` を渡し、例外時に直前まで巻き戻して再構築する現行のリカバリ手順を維持する。

## UI 状態のリセット（問題度: 中）
- `key` 付き再マウントで一時状態を必ず破棄し、`resetUiStateAfterTimelineChange()` を BattleView に集約する。これにより Snapshot から生成される DOM が常に同じになる。
- hover/selection だけでなく、`latestStageEvent` や `playerDamageOutcomes`・`currentAnimationId` も初期化してアニメーション残骸を消す。

## イベントフック／拡張（問題度: 低）
- 現時点では OperationLog の順方向再生のみを想定。将来イベントフックを巻き戻す必要が出た場合は、OperationLog に「イベント生成操作」を明示的に記録する方向で対応できる。

# 実装計画
1. **OperationRunner / ViewManager**
   - OperationRunner: `initialSnapshot` を常にディープコピーで保持し、`getInitialSnapshot()` でもコピーを返す。
   - ViewManager: 初回 rebuild で `initialBattleSnapshot` を保存し、以後の `rebuildFromOperations` に渡す。`executedOperationIndex` を更新して `canRetry()` / `hasUndoableAction()` の判定に利用。
2. **BattleView / UI 層**
   - リトライ/アンドゥ後に `resetUiStateAfterTimelineChange()` を呼び、hover/selection/エラーメッセージ/フッター/ダメージオーバーレイを初期化。
   - `viewResetToken` を導入し、`BattleHandArea`・`BattleEnemyArea`・`DamageEffects` に `:key` を付与して強制再マウント。Snapshot 変更時はこのトークンをインクリメント。
3. **フィクスチャ & テスト**
   - `LOG_BATTLE_SAMPLE2_SUMMARY=1 npx vitest tests/integration/battleSample2.spec.ts > /tmp/battleSample2.log`
     → `node scripts/updateActionLogFixtures.mjs` の手順で ActionLog フィクスチャを再生成し、`state-update:40` を含む想定に更新。
   - `npm run test:unit` で unit/integration 全体を再確認。HTMLMediaElement 周りの warning は既知として許容。
4. **UI ボタン挙動**
   - `canRetry()` / `hasUndoableAction()` をボタンの `:disabled` に反映済みか再確認し、初期状態に戻った際は確実に非活性になるよう監視。

# 不明点 / 要確認事項
- 現時点で追加の仕様不明点はなし。乱数シードや OperationLog の永続化が必要になった場合は別途検討する。
