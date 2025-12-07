## プレイヤー被ダメージ時の damage-effect と card-create バッチ統合計画

### 目的
- プレイヤー被弾時に発生するダメージ演出（DamageEffects）とカード生成演出（記憶カード等の card-create）を同一バッチで再生し、演出の分断とスナップショット遅延を解消する。

### 現状整理
- データ出自: `Battle.performEnemyAction` が `damageEvents` / `stateCardEvents` / `memoryCardEvents` / `cardsAddedToPlayerHand` を集約し、OperationRunner へ渡す。
- OperationRunner の `attachEnemyActAnimations` 現行挙動:
  - `enemy-act-start` バッチ: `enemy-highlight` のみ。`cardsAddedToPlayerHand` + state/memory イベントの `cardIds` を一時的に手札から除いた snapshot (`snapshotBeforeCardAdditions`) を使い、生成カードを隠す。
  - `enemy-action` バッチ: `buildEnemyActionInstructions` が `player-damage`（wait 500ms + 追撃×200ms）、`create-state-card`（wait 500ms）、`audio` を追加。snapshot には **カードを除去したまま** のものを使用するため、このバッチでは生成カードがまだ登場しない。
  - `remember-enemy-attack` バッチ: `memory-card`（wait 1500ms）を単独で入れる。ここで初めて生成カードを含む snapshot を適用し、手札に反映される。
- ViewManager 側: 各バッチで `stage-event` → `apply-patch/update-snapshot` → `wait` の順に実行。stage が先に流れ、patch 適用後に手札差分ウォッチで card-create アニメーションが走る。
- DamageEffects: `BattleView` の `stage === 'player-damage'` 監視で outcomes をセットし、`DamageEffects` を再生。
- 手札生成アニメ: `useHandStageEvents` が `create-state-card` / `memory-card` stage を受け、対象カードが snapshot に現れたタイミングで Materialize アニメを実行。snapshot にカードが含まれないと pending 扱いで、後続の snapshot 更新を待つ。

### 観測される課題
- `player-damage` と 記憶カード生成（`memory-card`）が別バッチのため、「被弾 → 待機 → カード生成」と段階が分かれ、手札反映も遅れる。
- enemy-action バッチの snapshot からカードを除外しているため、カード生成を同バッチ化する場合は snapshot/pach の差し替えが必要。

### 対応方針案
1. `memory-card` を `enemy-action` バッチへ統合し、damage-effect と card-create を同一 batchId/snapshot で扱う。
2. snapshot 選択を見直し、`enemy-action` バッチではカード生成後の snapshot（手札に新カードを含む）を使う。`enemy-act-start` だけ pre-add snapshot で隠す形を許容する。
3. バッチ順序は `enemy-act-start` → `enemy-action`（player-damage + create-state-card + memory-card + audio）。
   `remember-enemy-attack` を廃止する。
4. waitMs は現行値を維持（player-damage=500ms+、create-state-card=500ms、memory-card=1500ms）。enemy-action 全体の待機は最大値 1500ms でまとめ、別バッチ分の追加待機を削減。
5. card hide ロジックや batchId 発番を再確認し、手札反映のタイミングずれや二重アニメ発火を防ぐ。

### 作業ステップ案
1. 現行の enemy-act バッチ構造とカード除外ロジックをフィクスチャ（battleSample 等）で再確認し、回帰ポイントを整理。
2. `attachEnemyActAnimations` を調整:
   - `snapshotBeforeCardAdditions` を highlight 専用にするか撤去し、enemy-action 用 snapshot を post-action 版へ切り替え。
   - `memory-card` を enemy-action instructions に統合し、`remember-enemy-attack` バッチを削除。
   - create-state-card の cardId 伝搬・表示タイミングが崩れないか確認。
3. ViewManager / hand stage イベントの流れを確認し、snapshot 前提が変わることで pending 解消タイミングが変わらないかをチェック（必要ならガード追加）。
4. 期待 ActionLog フィクスチャ・テスト（`battleSample*`, `operationRunnerInstructions` など）を更新して新バッチ構造を検証。
5. ドキュメント（`animation_instruction.md` 等）に「memory-card は enemy-action に統合」を反映。
6. 手動確認: 敵攻撃で被弾し記憶カードが生成されるシナリオを再生し、ダメージ演出とカード生成が同バッチで同期することを目視確認。

### 不明点・要確認事項
1. 統合対象の card-create 範囲  
   - 選択肢: (A) `memory-card` だけを damage と統合、(B) `create-state-card` も含めて「生成系」を全て同バッチで必ず扱う。  
   - 推奨: (A) を主目的としつつ、snapshot 切替で state-card の見え方も変わるため、副作用確認を行う。
2. enemy-action バッチで使う snapshot  
   - 選択肢: (A) highlight だけ pre-add、enemy-action は post-add snapshot を採用、(B) すべて pre-add を使い、card-create 用 patch を別途差し込む。  
   - 推奨: (A) stage-event → patch → wait の順序を維持しつつ、enemy-action 中にカードを出現させる。
3. バッチ待機時間の扱い  
   - 選択肢: (A) 現行 wait を維持し enemy-action の wait を 1500ms に集約、(B) 同バッチ化に合わせて短縮/分割する。  
   - 推奨: (A) まずは現行値踏襲で挙動差分を限定し、体感に問題があれば追加調整。
4. `remember-enemy-attack` の扱い  
   - 選択肢: (A) バッチそのものを廃止、(B) 将来用途に備え空バッチを残す。  
   - 推奨: (A) 廃止してバッチ数を減らす。別用途が必要なら (B) へ切替える前に要件確認。
