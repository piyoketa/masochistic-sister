# OperationLog × View 統合メモ（2024-xx-xx）

最新の実装状況と残課題をまとめたドキュメント。フェーズごとに「完了/進行中/未着手」を明確にし、次に着手すべきタスクを洗い出す。

---

## 1. 現状サマリ
- **OperationRunner 駆動**  
  - ViewManager は OperationLog を直接保持し、OperationRunner を通じて Battle/ActionLog を更新する構造に移行済み。
  - Undo/Retry は OperationLogIndex で巻き戻す仕組みに置き換え済み。初期 Snapshot の差し替えも可能。
- **Snapshot / Battle 初期化**  
  - `Battle.captureFullSnapshot()` / `restoreFullSnapshot()` 実装済み。敵行動キューも含めて復元できる。  
  - `Battle.initialize()` が初期手札3枚を配布し、ターン開始ドローは固定2枚に統一済み。
- **Scenario / テスト**  
  - `battleSampleScenario*.ts` は OperationLog 前提で再構築済み。  
  - integration テスト・ViewManager/BattleView の単体テストも新フローに追随済み。
- **UI**  
  - BattleView では OperationLog に基づく操作（play-card/end-turn）が稼働中。  
  - 手札表示（ActionCardタグ、山札/捨て札/手札カウンタ等）は最新UXへ更新済み。

---

## 2. 進捗ステータス
| 項目 | 状況 | メモ |
| --- | --- | --- |
| OperationRunner を UI 側で利用 | ✅ 完了 | onEntryAppended hook で ViewManager 同期待ち |
| Battle 初期化＋ドロー統一 | ✅ 完了 | 初手3枚＋ターン2枚に揃えた |
| Scenario/Integration テスト更新 | ✅ 完了 | OperationLog前提の検証に刷新 |
| ViewManager undo/retry 巻き戻し | ✅ 完了 | OperationRunner 差し替えで再レイ生成 |
| Snapshot に敵行動キュー含む | ✅ 完了 | RNG シード保存は未実装 |
| AnimationInstruction 設計 | ⚠️ 一部のみ | ドキュメント更新済だが実際の生成/再生は未着手 |
| OperationLog `toJSON/fromJSON` | ⛔ 未着手 | セーブ/ロード実装予定に向けて保留 |
| ViewManager/Front を OperationLog payload に統一 | ⚠️ 部分的 | BattleView は移行済、Title/他UIやOperationRunner直接呼び出す部分は未整理 |
| アニメーション待機制御 | ⚠️ 着手中 | Runnerはwait情報を返すのみ。View側で活用未実装 |
| RNG シリアライズ | ⛔ 未着手 | 巻き戻し後に乱数ズレが残る可能性あり |

---

## 3. 残課題リスト

### 3.1 ロジック/モデル
1. **RNG シリアライズ**  
   - ActionQueue以外の乱数（ドロップ/敵行動で RNG 使用箇所があるなら）を保存し、Undo/Retry後も確 determinism を確保する。
2. **State/Event 差分適用**  
   - AnimationInstruction が差分パッチを持つ想定だが、現在は BattleSnapshot をフル更新。パフォーマンスと可視化に向け差分モデルを検討。

### 3.2 OperationRunner / ViewManager
1. **AnimationInstruction 実装**  
   - Runner がエントリごとに AnimationInstruction[] を組む仕様（enemy_turn_animation.md 参照）を実装。  
   - ViewManager は instruction queue を解釈し、待機時間（waitMs）、snapshot差分、DamageOutcome animation などを再生する。
2. **Runner wait情報の活用**  
   - 現在は `wait` command を enqueue していない。`onEntryAppended` の waitMs 情報を AnimationScript に変換する。
3. **OperationLog payload の一元化**  
   - BattleView 以外で ActionLog ベースの操作が残っていれば排除する。  
   - TitleView/プリセット選択UI も OperationLogEntry を通じて入力する形へ統一。

### 3.3 UI/UX
1. **AnimationInstruction 対応 UI**  
   - BattleEnemyArea/BattleHandArea/HpGauge など、差分更新やアニメーション再生に必要なフックを追加。  
   - 敵行動ごとのハイライト・待機時間（0.5s 等）をアニメーション再生で確認できる状態にする。
2. **OperationLog Undo/Redo UI**  
   - 現状は Undo のボタン制御のみ。将来的に OperationLog の履歴ビューや「何手戻すか」選択 UI が必要なら仕様策定。

### 3.4 テスト/ツール
1. **AnimationInstruction 系テスト**  
   - Runner が指示通りの instruction を生成しているか検証する単体テスト。  
   - ViewManager が instruction queue を再生し、状態を期待どおり更新する結合テスト。
2. **OperationLog serialization**  
   - `OperationLog.toJSON()/fromJSON()` の仕様とテストを整備し、セーブ/ロード対応に備える。

---

## 4. 直近 TODO（優先順）
1. **AnimationInstruction MVP**  
   - Runner: entry→instruction 生成。  
   - ViewManager: instruction queue を `enqueueAnimation` へ流し、BattleView で wait/snapshot 更新を視覚化。  
   - 最低限 `play-card` / `enemy-act` / `victory` のフローを再生可能にする。
2. **RNG シリアライズ**  
   - Deck シャッフル・敵行動ランダム性を含む RNG の seed/state を Snapshot に保存。  
   - Undo/Retry 後に行動順が変わらないことをテストで保証。
3. **OperationLog serialization API**  
   - JSON 形式で OperationLog を吐き出し/読み込む下準備。  
   - CLI/デバッガで OperationLog を外部保存できるようにし、再現性テストを容易にする。

---

## 5. 参考リンク
- `documents/enemy_turn_animation.md` … AnimationInstruction の詳細仕様。
- `tests/fixtures/battleSampleScenario*.ts` … OperationLog/Scenario の最新参照実装。
- `src/view/ViewManager.ts` … OperationRunner を組み込んだ最新 ViewManager 実装。
- `src/domain/battle/OperationRunner.ts` … 現行 Runner のエントリ生成フロー。

---

## 6. まとめ
OperationLog 駆動の基盤は概ね完成し、Undo/Retry やテスト群は新仕様に追随した。残タスクは「アニメーション指示の生成と再生」「RNG完全シリアライズ」「OperationLog 永続化API」の3本柱。これらを実装すれば、UI/モデル間の整合性と再現性が確保され、次フェーズ（シナリオ拡張や演出強化）へ進める。***
