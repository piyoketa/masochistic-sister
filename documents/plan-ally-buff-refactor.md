## 敵行動計画／追い風ターゲット抽選の再設計計画

### 背景・課題
- `Battle.applyActionLogEntry` の `start-player-turn` で `enemyTeam.ensureActionsForTurn` と `planUpcomingActions` を別々に呼んでおり、計画確定とターゲット抽選が分離している。
- 予測シミュレーション（`simulateEndTurnPrediction`）でも `planUpcomingActions` が走り、ターゲット未設定によるスキップログが多数出るなど、責務の境界が曖昧。
- `TailwindAction` の plannedTarget がスナップショットに含まれないため、予測／実戦で整合が取れず表示も不安定。
- 行動キュー側でターゲット確定ができていないため、`EnemyTeam` 側に特例ロジックが残っている。

### 目標
- 行動確定（`ensureActionForTurn`）のタイミングで、計画が必要なアクション（味方バフなど）のターゲットも同時に決定する。
- 予測シミュレーションと実戦で同じ経路・同じデータ（plannedTarget）を扱い、表示・ログの揺れをなくす。
- `EnemyTeam.planUpcomingActions` を廃止し、`EnemyActionQueue`／`Action` に責務を寄せる。
- スナップショットに必要な計画情報（plannedTargetIdなど）を載せ、View側の再計算依存を減らす。

### 方針案
1. **計画フェーズの統合**
   - `Enemy.confirmActionForTurn` / `EnemyActionQueue.ensureActionForTurn` の内部で、先頭アクションが `PlanAllyTargetSkill` を実装していれば `planTarget` を呼ぶ。
   - 対象が見つからなければ、キュー側で破棄 or 次の行動に差し替え（現行`planUpcomingActions`のループを移植）。
2. **スナップショット拡張**
   - `Action`（少なくとも `PlanAllyTargetSkill`）に `serializePlan()` を追加し、`plannedTargetId` をスナップショットへ含める。
   - `BattleSnapshot`/`EnemyQueueSnapshot` に `plannedTargets` を持たせ、復元時に `Action` へ戻す。
   - View のヒント生成はスナップショットから `plannedTargetId` を読む（再計算不要）。
3. **予測シミュレーションの整合**
   - `ensureActionForTurn` が計画も確定するため、予測側でも同じ行動・同じターゲットで再現できる。
   - 予測専用ガードは最小限（不要なログを抑える程度）。
4. **`EnemyTeam` の簡素化**
   - `planUpcomingActions` を削除し、`ensureActionsForTurn` 内でキューに「計画と確定」を完結させる。
   - 召喚などの例外（`SummonAllyAction`）は、新メソッド `EnemyTeam.refreshPlansForTurn(turn)` のような薄い呼び出しに統一。
5. **デバッグ・テスト**
   - ally buff のターゲットシリアライズ／デシリアライズのユニットテストを追加。
   - 予測シミュレーションでも同じターゲットになることを保証するテストを追加。

### タスク一覧
- 設計変更前の調査
  - [ ] 既存スナップショット構造（`EnemyQueueSnapshot`）に計画情報をどう載せるか調査。
- 実装
  - [ ] `Action`/`PlanAllyTargetSkill` に計画情報の serialize/restore インターフェースを追加。
  - [ ] `EnemyActionQueue.ensureActionForTurn` で `planTarget` を実行し、対象なしなら置換/破棄するロジックを移植。
  - [ ] `BattleSnapshot`/`EnemyQueueSnapshot` に計画情報を追加し、`restore` で `Action` に反映。
  - [ ] `EnemyTeam.planUpcomingActions` を削除または新APIに置換し、呼び出し箇所を全て `ensureActionsForTurn` 経由に変更。
- View/ヒント
  - [ ] `enemyActionHintBuilder` でスナップショットの plannedTarget を読むように変更し、`planUpdateToken`依存を簡素化。
- テスト
  - [ ] ally buff 計画のシリアライズ/復元テスト。
  - [ ] 予測シミュレーションと実戦で同じ plannedTarget になることのテスト。
  - [ ] 追い風対象表示がプレイヤーターン中から出ることのUIテスト（必要なら最小限）。

### 不明点・要判断
- plannedTarget をスナップショットへ載せる形式  
  - 既存 `Action` シリアライズが無いので、新しく `ActionPlanSnapshot` を定義するか？  
  - **おすすめ:** `EnemyQueueSnapshot` に `{ turn, action, plan?: { targetId?: number } }` を追加し、特定のActionのみが解釈する方式。
- 対象が見つからない場合の振る舞い  
  - 現状は破棄して次を選ぶ。キューのランダム性に影響するが維持して良いか。  
  - **おすすめ:** 現行仕様踏襲（破棄して次へ）。
- 予測シミュレーションでのログ出力  
  - 抑制すべきか、トレース用に残すか。  
  - **おすすめ:** フラグで抑制可能にするが、デフォルトは抑制しない。

本計画で問題なければ実装に着手します。変更範囲が広いため、進め方やスナップショット形式の希望があれば指示をください。
