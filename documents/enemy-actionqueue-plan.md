## 敵行動キュー再設計 計画（更新版）

### 目的
- フロントは Battle 経由で敵の行動予測を直接取得し、BattleSnapshot の nextActions 依存を解消する。
- EnemyActionQueue を「ターン別の履歴保持型」にし、取り出しても消えない行動列を保持する。
- 行動決定の再現性を確保するため、敵ごとの専用シード RNG を使用し、Battle の初期化時に決定したシードを Snapshot へ保持・復元する。

### 基本方針
1. **ターン情報の明示化**
   - 型: 
     ```ts
     export type BattleTurnSide = 'player' | 'enemy'
     export interface BattleTurn {
       turn: number      // 1-based。先制行動など将来的な0ターンも許容
       side: BattleTurnSide
     }
     ```
   - BattleSnapshot に `turnPosition: BattleTurn` を含め、現在のターン位置を常に取得できるようにする（実装済み）。

2. **敵キュー専用シードの導入**
   - Battle開始時に「バトル全体のシード」から敵ごとにサブシードを派生させ、EnemyActionQueue 初期化時に注入する。
   - シードは Snapshot/FullSnapshot に保存し、リプレイ・リスタート時は同じシードでキューを再生成する。
   - 他の乱数（ドロー、ドロップ等）とはストリームを分離し、キュー内部の乱数は専用RNGに統一する。

3. **EnemyActionQueue の構造**
   - 現行の消費型キューを「ターン別配列」に変更。
   - 型のイメージ:
     ```ts
     export interface EnemyTurnActionEntry {
       turn: number       // 1-based, 先制は将来0を許容
       action: Action     // 1ターン1行動を前提（将来拡張時は配列に）
     }
     ```
   - 保持フィールド例: `turnActions: EnemyTurnActionEntry[]`
   - 取得API: `getActionForTurn(turn: number): Action | null`
   - 将来拡張余地: 1ターン複数行動に対応する場合は `getActionsForTurn(turn: number): Action[]` などに拡張。

4. **行動決定と参照フロー**
   - 行動決定はキュー内部でシード付きRNGを使って行い、決定したアクションを `turnActions` に格納（消費しない）。
   - フロントは Battle → Enemy → actionQueue → `getActionForTurn(currentTurn)` で行動予測を取得する。
   - 行動済み判定は従来どおり Snapshot の `hasActedThisTurn` を用い、UI表示に反映する。

5. **Snapshot の扱い**
   - BattleSnapshot から `nextActions` を削除（予定）。行動予測は Battle インスタンス＋キューから取得。
   - FullSnapshot には「敵ID→queueSeed」および必要ならキュー状態全体を保持。リプレイ時はシードを使って再生成。

6. **行動書き換え/複数行動（将来対応）**
   - 今回はインターフェースだけ意識し、実装は後回し。1ターン複数行動に備え、`turn`をキーに配列で保持できる設計にしておく。

### タスク
1. 型とインフラ
   - `BattleTurn` は導入済み。BattleSnapshot に `turnPosition` を追加済み。
   - `EnemyActionQueue` に専用 RNG フィールド、シード受け取りを追加し、`turnActions` による履歴保持型へリファクタ。
   - キュー派生クラス（Default/Conditional/Beam など）の乱数呼び出しを専用RNGに統一。
2. Battle初期化・Snapshot
   - Battle開始時にバトルシード→敵ごとのサブシードを生成し、キューに注入。
   - FullSnapshot にキューシードを保存し、restore 時に同シードでキューを再構築。
3. 行動予測生成とUI
   - `enemyActionHintBuilder` などをキュー直接参照に切り替え。Snapshotの `nextActions` を削除し、Fixture更新。
   - UI（EnemyCard / enemyActionFormatter など）が Battle＋currentTurn から行動を取得するよう修正。
4. テスト・型更新
   - `EnemyActionHint` 型や関連型の整理。
   - unit/integration の期待値を新構造に合わせて更新（Snapshotから nextActions を除去、シード対応部分のFixture調整）。

### リスク/注意
- 乱数呼び出し順が変わると再現性が失われるため、キューの生成/更新での RNG 呼び出し順を固定すること。
- 行動書き換え・キュー差し替えは今回非対応だが、将来は「既決定の行動を置き換えるだけにする」のか「再計算する」のか方針を決める必要がある。

以上の方針で実装を進めます。
