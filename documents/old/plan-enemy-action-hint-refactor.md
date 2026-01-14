## 敵行動予測表示リファクタ計画

### 背景・課題
- 敵行動予測表示のロジックが `BattleView.vue` や各コンポーネントに散在しており、再利用性・テスト性が低い。
- フロント側の再生スナップショットと `Battle` 実体の時間軸がずれるため、行動キューは実体から、状態や acted フラグはスナップショットから取得する必要があり、責務が混在している。
- 行動予測が崩れた際のログ取得手段がない。

### 目的
- 敵行動予測の生成・整形を1箇所に集約し、ユニットテスト可能な形にする。
- 表示コンポーネントを `BattleEnemyArea` 直下に分離し、`EnemyCard` から切り離す。
- 再生中のスナップショットと実体キューの併用を明確化し、時間軸ずれを考慮した API を提供する。
- トラブルシュート用のログ出力を環境変数で制御できるようにする。

### 変更方針
1. **生成ロジックの集約**
   - 入力: `Battle` インスタンス（行動キュー参照用）と表示中 `BattleSnapshot`（states/actedフラグ用）、ターン情報。
   - 出力: `Map<enemyId, EnemyActionHint[]>` の純関数化ユーティリティを新設（例: `buildEnemyActionHintsForView`）。  
   - ヒント生成時に、行動キューから指定ターンのアクションを取得し、スナップショットの状態/acted をマージする。
2. **コンポーネント構造**
   - `BattleEnemyArea` 配下に「敵行動表示」専用コンポーネントを新設（例: `EnemyActionHintsPanel`）。  
   - `EnemyCard` から行動表示責務を除去し、`BattleEnemyArea` → `EnemyActionHintsPanel` に必要情報を渡す。
3. **キャッシュと再計算**
   - 再生中は `snapshot` と `turnPosition` を依存に、行動済み敵のヒントをキャッシュする現行方針を踏襲しつつ、集約ユーティリティでテストしやすくする。
   - 行動計画更新トリガー（planUpdateToken）を利用し、計画変更時にキャッシュをクリアする。
4. **ログ出力**
   - 環境変数（例: `VITE_DEBUG_ENEMY_HINT_LOG`）で、生成入力（ターン/side/スナップショット vs 実体）や出力ヒントを `console.info` に吐くオプションを用意。

### タスク
- [ ] 新ユーティリティ作成: `buildEnemyActionHintsForView(battle, snapshot)`（純関数化、テスト可能）。
- [ ] 既存の `enemyActionHintsById` ロジックをユーティリティ呼び出しに置き換え、キャッシュの依存を整理。
- [ ] `BattleEnemyArea` 配下に行動表示コンポーネントを新設し、`EnemyCard` から行動表示を切り離す。
- [ ] デバッグログの環境変数追加と実装。
- [ ] 影響箇所の型調整（`EnemyActionHint` など）。

### テスト観点
- 指定ターンでの行動キューとスナップショットの状態をマージした結果が期待通りになるユニットテスト。
- 行動済み敵のキャッシュ動作（敵ターン再生中に再計算しないこと）。
- planUpdateToken 変化時に再計算されること。
- デバッグログフラグON/OFFで出力が切り替わること（最小限）。

### 不明点・要確認
- 新ユーティリティの配置先: `src/domain/battle` 配下か、`src/view` 配下か。  
  - **案:** View寄りの責務なので `src/view/enemyActionHintBuilderForView.ts` などに置く。
- 行動表示コンポーネントの具体名・配置: `BattleEnemyArea` 配下でOKか、別フォルダを希望するか。  
  - **案:** `components/battle/EnemyActionHintsPanel.vue` とし、`BattleEnemyArea` から props 供給。
- デバッグログの標準出力先: `console.info` で問題ないか。  
  - **案:** 既存デバッグ方針に合わせ `VITE_DEBUG_ENEMY_HINT_LOG` で制御。

問題なければ、この計画に沿って実装を進めます。
