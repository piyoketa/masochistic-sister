## OrcSumo 用 条件付き EnemyActionQueue 検討メモ

### 現状の「行動確定タイミング」
- **初期化時**: `EnemyActionQueue.initialize` が `ensureActionForTurn(1)` を呼び、ターン1の行動を即決定する。
- **行動予測表示時**: `buildEnemyActionHints` 内で `enemy.confirmActionForTurn(turnPosition.turn)` を呼ぶため、ヒント生成タイミングでも未確定ならそのターンの行動を決定する。
- **実際の行動時**: `Enemy.act` 内で `ensureActionForTurn(battle.turnPosition.turn)` を呼び、敵フェーズの実行直前に最終確定する。
  - Battle側では「次ターン開始時」に一斉決定するフックはなく、`ensureActionForTurn` が呼ばれた瞬間に決定→キャッシュされる。

### 課題
- 行動決定が「呼ばれた瞬間」に行われるため、ヒント生成タイミングで確定してしまうことがある。
- OrcSumo のように「プレイヤーに重量化があるときだけ別スキルを選ぶ」場合、どのタイミングでプレイヤー状態を評価するかを設計する必要がある。

### 設計案
1. **条件付き Queue のサブクラスを実装し、`pickActionForTurn` で状態を判定する（推奨・小変更）**
   - `ConditionalOrcSumoQueue` を作り、`pickActionForTurn(turn)` 内で `context.battle.player.hasState('state-heavyweight')` のように判定して `BattleDanceAction` を返す。それ以外は `FattenAction` or `FlurryAction` を従来ロジックで選択。
   - `setContext` を使って `battle` と `owner` を渡し、`ensureActionForTurn` で一度決定したら以降は固定（キャッシュ）とする。
   - **ヒントの確定タイミング**が従来通り（ヒント生成時 or 行動時）になるので、意図したタイミングだけで呼ばせたい場合は、フロントのヒント生成を「未行動の敵だけ」に限定するなどの運用を合わせる。

2. **敵ターン開始時に明示的に次ターン分を確定するフックを追加する**
   - `EnemyTeam.startTurn` などで各敵に対し「現在ターン番号の行動を必ず `ensureActionForTurn` で決定する」処理を入れる。
   - 行動確定のタイミングが一元化され、ヒント生成で偶発的に決定しなくなる。  
   - 既存の `ensureActionForTurn(1)` 初期化と二重にならないよう調整が必要。

3. **「条件付き選択」のみ defer し、その他は従来どおり**
   - 通常の行動は初期化時に決定するが、`ConditionalOrcSumoQueue` のように判定が必要なターンは「ヒント表示のための呼び出し」では確定せず、`Enemy.act` の直前だけ判定するようにフラグを追加する。
   - 具体的には `ensureActionForTurn` の内部で「条件付きターンの場合、呼び出し元がヒント生成ならスキップし、行動直前（act経由）の呼び出しで確定する」ようなモードを持たせる。
   - 実装は複雑になるため、案1で十分なら不要。

### 推奨実装方針
- まずは **案1** を採用し、`ConditionalOrcSumoQueue` の `pickActionForTurn` でプレイヤーの状態を見て行動を選択する。
- 将来的に「いつ確定するか」を明確にしたい場合は、案2で「敵ターン開始時に確定する」フックを追加し、ヒント生成時は既に確定済みの値を読むだけにする。

