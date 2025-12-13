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

# 元のメモ

EnemyActionQueueと、敵の行動予測表示の仕組みを根本から見直します。

- 現在、敵の次の行動予測（Next Action）は、battlesnapshot経由でフロントに渡して表示していますが、フロントエンドから、直接EnemyActionQueueにアクセスして取得する方式への変更を検討します。
    - フロントエンドは、battle経由で　enemyidを引数として、その敵の行動キューを取得できるようにします。
- EnemyActionQueueの実装を以下のように変更します
    - 現在
        - シンプルなキューとして、取り出したアクションはデータとして消えてしまう
    - 修正後
        - 「１ターン目の行動は〇〇」「２ターン目の行動は〇〇」というように、過去の行動を含めて、配列として保持しておく
        - 「現在のターン数」を引数にすることで、アクションを取得できるメソッドを用意します。
        - フロントエンドは、現在のターン数を用いてアクションを取得します。例えば現在がプレイヤーの3ターン目なら、「敵の３ターン目の行動」を、「敵の３ターン目」なら、「敵の３ターン目の行動」を取得します。これにより、ターン数が増加したときに、表示が自然に更新されるはずです。
            - つまり、アクションを取り出した後もデータが消滅しません
        - 敵の行動済みステータスは、引き続きスナップショットでコントロールします。
- 注意点　将来的に対応したい要件
    - １ターンの複数回行動
        - このゲームの複雑な点として、「被虐のオーラ」など、敵を即座に行動させるアクションを取ることで、敵の行動が１ターン中に複数回になることがあり得ます。
        - 現在、被虐のオーラ（自分のターンに敵を強制行動させる）は、発動後は行動済みステータスになるだけで、敵の行動表記は変化しません。
        - しかし、将来的には行動後も行動済みステータスにならず、次に予定されていた行動を次の相手のターンにやるようになります。つまり、１ターンの行動が複数回になることがあります。現時点ではこの要件に対応する必要はありませんが、将来的な拡張性も検討しておいてください。
        - 将来的には、１ターン中のアクションも配列として保持しておき、「３ターン目の２回目の行動」のようにインデックスで取得できるようにします。
    - 行動変化の表示
        - 例えば「天の鎖」のように、相手の次のアクションを書き換える効果を持つカードを使用する場合、TargetEnemyOperationの操作中（EnemyCardのhover中）に、現在の行動予測から何に変化するかを、現在のアクション → 変化後のアクション という形式で表示できるようにしたいです。