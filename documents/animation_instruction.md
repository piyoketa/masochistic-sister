シナリオ：stage2の設定において、`play-card` によって、10×2の突き刺すをかまいたちを使用し、かまいたちを撃破。その後、なめくじが最後の一体になったので、なめくじの「臆病」によりなめくじが逃走。敵全員がいなくなったので、勝利 `victory` となった。

このシナリオは、以下のアニメーションを持ちます。

- BattleActionLogEntry: `play-card`
    - 手札の「突き刺す」を捨て札に移動する
    - オークに10×4ダメージ。HPが0になる。
    - オークが撃破される。
- BattleActionLogEntry: `event`
    - なめくじの臆病により、なめくじが逃走する
- BattleActionLogEntry: `victory`
    - 結果オーバーレイが表示される。

## AnimationInstructionステージの指針

ステージは「何のアニメーションを描画するか」を表します。原因（イベント種別）ではなく、描画対象にフォーカスした命名とし、同じ効果ならどこから発生したかに関わらず同ステージを再利用します。

| stage | 表示内容 | 典型的な発生元 |
| --- | --- | --- |
| `battle-start` | 初期手札と盤面反映 | `battle-start` |
| `turn-start` | ターン開始フェーズ突入の通知（各種リセット後の状態を描画） | `start-player-turn` |
| `deck-draw` | 山札や各種追加効果で手札に入ったカードを描画（draw数・手札上限情報付き） | ターン開始ドロー、日課などのドロー効果 |
| `card-trash` | 手札のカードを捨て札に送る | `play-card`, 再装填などのカード効果 |
| `card-eliminate` | カードが消滅する | [消滅]カードの`play-card` |
| `create-state-card` | 敵から受けた状態異常カードを生成し手札へ追加 | `Player.addState` |
| `memory-card` | 敵攻撃の記憶カードを生成し手札へ追加 | `Player.rememberEnemyAttack` |
| `enemy-damage` | 敵に対するダメージ演出 | `play-card` |
| `player-damage` | プレイヤーに対するダメージ演出 | `enemy-act` |
| `defeat` | 敵カードのフェードアウト（撃破） | `play-card` |
| `escape` | 敵カードのフェードアウト（逃走） | `event`（例: trait-coward） |
| `enemy-highlight` | 行動中の敵カードを強調 | `enemy-act` |
| `mana` | マナ加算/消費エフェクト | `player-event` (mana), `play-card` |
| `audio` | 効果音の再生トリガー | `play-card`, `enemy-act`, サウンドイベント |
| `cutin` | カットイン画像の再生トリガー | `play-card`（Action CutInCue） |
| `turn-end` | プレイヤーターン終了状態 | `end-player-turn` |
| `victory` / `gameover` | リザルトオーバーレイ | それぞれの終端エントリ |

## AnimationInstruction生成ルール（エントリ種別ごと）

| Entry type | Instruction ラフ | 待機時間 | 備考 |
| --- | --- | --- | --- |
| `battle-start` | [0] バトル初期状態 snapshot | 0ms | 初期3枚の配布後を描画 |
| `start-player-turn` | [0] `turn-start`, [1] `deck-draw` | 0ms | マナリセットは snapshot で表現し、手札上限超過は `deck-draw.metadata.handOverflow` へ集約 |
| `play-card` | 行動による | 行動による | 詳細は後述 |
| `enemy-act` | 行動による | 行動による | 攻撃時は `player-damage`、状態・記憶カード生成時は `create-state-card` / `memory-card` を挿入。行動不能ならアニメーション無し |
| `end-player-turn` | [0] `turn-end` | 0ms | 敵行動再生は個別の `enemy-act` |
| `victory` / `gameover` | [0] `victory` or `gameover` | 400ms | リザルト表示 |
| `event` | 状況による | 状況による | 戦いの準備によるマナ追加や、なめくじの臆病による逃走など、なんらかのタイミングトリガーで発生したイベント。 |

### play-card の AnimationInstruction 詳細
play-card時のAnimationInstructionの生成例を示します。

「1コスト 10ダメージ×3回の突き刺す」を使用した場合

1. **[0] `mana`**
   - マナを消費（マイナス）または獲得（プラス）した値を示す。
2. **[1] `card-trash` / `card-eliminate`**  
   - 使用カードが移動した直後の snapshot。手札→捨て札の場合は `card-trash`、消費カードは `card-eliminate`（消滅演出は 720ms 固定）。
3. **[2] `enemy-damage`**  
   - ダメージを伴う場合のみ生成。`metadata.damageOutcomes` にヒット配列を含め、待機時間は (ヒット数-1)×0.2s。
4. **[3] `defeat`**  
   - 撃破された敵がいる場合のみ追加。1sかけて EnemyCard を透過させる。

ダメージやカード生成が無い場合でも、`update-snapshot` コマンドが盤面差分を反映するため、`state-update` のようなフォールバック stage は不要になった。

### enemy-act の詳細
enemy-act時のAnimationInstructionの生成例を示します。

- **行動がスキップされた場合**: AnimationInstructionは生成されない（`enemy-highlight` も表示しない）
- **攻撃行動**:  
  1. `enemy-highlight`  
  2. `player-damage`（ヒット数に応じて `(hits-1)*0.2s` 待機。ただし記憶カード追加がある場合は 0ms）  
  3. `create-state-card`（被弾時に `Player.addState` が呼ばれた場合）  
  4. `memory-card`（`Player.rememberEnemyAttack` が発火した場合。攻撃バッチ終了後に再生）
- **バフ/デバフ行動**:  
  1. `enemy-highlight`  
  2. `create-state-card` / `memory-card`（行動に応じて複数バッチを連結）

## BattleActionLogEntry生成リファクタ計画

1. **Battle側のイベント収集**  
   - `drawForPlayer` が全てのドロー発生源（初期手札・日課・敵攻撃など）で呼ばれるよう保証し、引いたカードIDを `pendingDrawAnimationEvents` に積む。  
   - 割り込み敵行動は `queueInterruptEnemyAction` で予約し、OperationRunner が `executeInterruptEnemyActions` を通じて `enemy-act` を挿入できるようにする。  
   - `stateEventBuffer` / `resolvedEventsBuffer` で扱う payload を型定義し、trait-coward や mana などステージ判定に必要な情報を取得しやすくする。

2. **OperationRunnerでのInstruction生成**  
   - `attachPlayCardAnimations`: `card-trash / card-eliminate → deck-draw* → mana* → 追加のcard-trash* → damage* → defeat* → create-state-card* → memory-card*` の順に命令を構築し、ダメージの無いカードでは `damage` を出さない。`mana` インストラクションは `Player.spendMana` で積まれたイベントを取り出して配置する。  
   - `attachEnemyActAnimations`: 手札追加がある場合のダメージ待機を 0ms に固定し、状態異常カードは stage=`create-state-card`、記憶カードは stage=`memory-card` で出力。ダメージや撃破は各エンティティの `takeDamage` が直接キューに積んだ情報を利用する。  
   - `attachSimpleEntryAnimation`: `start-player-turn` で `turn-start` + `deck-draw` を差し込み、`player-event` (mana) は stage=`mana`、`state-event` は `escape` のみ特殊処理し、それ以外は snapshot 更新に任せる。

3. **ActionLogエントリ列の整合性**  
   - `appendImmediateEnemyActEntries` で `executeInterruptEnemyActions` を呼び出し、被虐のオーラ直後にも `enemy-act` を挿入。  
   - `flushResolvedEvents` / `flushStateEvents` の呼び出し順を見直し、`play-card` 後のイベントでも漏れがないようにする。  
   - `OperationRunner.getWaitInfo` や `appendBattleOutcomeIfNeeded` といった補助メソッドが新stageの待機仕様と矛盾しないか確認。

4. **テスト & フィクスチャ更新**  
   - `LOG_BATTLE_SAMPLE*_SUMMARY=1` ＋ `scripts/updateActionLogFixtures.mjs` で期待ActionLogを再生成し、`tests/integration/battleSample*.spec.ts` で全ケースが緑になるまで更新。  
   - `tests/domain/battle/operationRunnerInstructions.spec.ts` 等に `deck-draw`・`create-state-card`・`memory-card`・`escape` の単体テストを追加し、View未実装でも挙動がわかるようにする。  
   - 付随ドキュメント（`enemy_turn_animation.md`, `INTEGRATION_TEST_FORMAT.md`）も新stageと生成手順で同期させ、将来の実装者が迷わないようにする。

## 実装TODOリスト

1. **Battle / Player / Enemyのイベントキュー化**
   - `Player.spendMana` で `Battle.recordManaAnimation({ amount: -cost })` を呼ぶ。
   - `Player.takeDamage` および `Enemy.takeDamage` で `recordDamageAnimation` を呼び、敵側では撃破判定時に `recordDefeatAnimation(enemyId)` も積む。
   - 逃走や特殊ステートによる退場イベントを `stateEventBuffer` に構造化して格納し、`escape` ステージへ繋げる。

2. **Battle API 拡張**
   - `recordManaAnimation`, `recordDefeatAnimation`, `consumeManaAnimationEvents`, `consumeDefeatAnimationEvents` を追加し、OperationRunnerから取得できるようにする。
   - `queueInterruptEnemyAction` / `executeInterruptEnemyActions` でプレイヤーターン中の敵行動をActionLogに変換する。

3. **OperationRunner調整**
   - `attachPlayCardAnimations` で `card-trash / card-eliminate`・`deck-draw`・`mana`・`create-state-card`・`memory-card` のキューを順番に取り出し、不要な stage を生成しないよう分岐を整理する。
   - `attachEnemyActAnimations` を `create-state-card` / `memory-card` 前提に更新し、手札追加時の待機時間0msを徹底。
   - `attachSimpleEntryAnimation` で `state-event` → `escape` のみ特殊処理し、それ以外は snapshot 差分に任せる方針へ揃える。

4. **ActionLog生成フロー**
   - `appendImmediateEnemyActEntries` を `play-card` 実行後に呼び出し、`executeInterruptEnemyActions` から割り込み行動をActionLogへ追加する。
   - `flushResolvedEvents` / `flushStateEvents` の順序を確認し、演出イベントが欠落しないよう調整。

5. **テスト・フィクスチャ**
   - unit: `Player`/`Enemy`/`Battle` の新APIに対する単体テストを追加し、イベントキューの挙動を確認。
   - integration: battleSample1/2 の期待ActionLog再生成＋比較テスト更新。
   - ドキュメント: `enemy_turn_animation.md` と `INTEGRATION_TEST_FORMAT.md` を新stage仕様で更新。

## Damage / Defeat / Mana イベントの発火タイミング

1. **プレイヤー被ダメージ**  
   - `Player.takeDamage` 内で `Battle.recordDamageAnimation` を呼び出し、`DamageAnimationEvent` をペイロード付きで積む。OperationRunner はこのバッファを `player-damage` ステージに変換するだけに留め、発生源を意識しない。

2. **敵被ダメージ・撃破**  
   - `Enemy.takeDamage` でHP下降を処理したタイミングで、撃破が確定した場合は `Battle.recordDefeatAnimation(enemyId)` のようなAPI（新規）を呼び出し、`defeat` ステージ用のフラグを積む。OperationRunnerは `consumeDefeatAnimationEvents`（新設）で取得して `defeat` 指示を生成する。

3. **マナ消費 / 増加**  
   - `Player.spendMana` が呼ばれたタイミングで `Battle.recordManaAnimation({ amount: -cost })` を積み、`mana` ステージとして再生する。既存のプレイヤーイベント（戦いの準備など）によるマナ増加も `Battle.recordManaAnimation({ amount: +1 })` を通して共通化。OperationRunner側は `consumeManaAnimationEvents` を `attachPlayCardAnimations` や `attachSimpleEntryAnimation` から呼び出す。

4. **キュー化の基本方針**  
   - 「演出に関するメタ情報は、発火元のエンティティ/処理で積む」→「OperationRunnerは積まれたイベントを順番にAnimationInstructionへ変換する」構造を徹底し、将来的にView側で必要な粒度（example: プレイヤー被ダメージなのか敵被ダメージなのか）を判別しやすくする。

## 新ギミック（ダメージ連動 / 瘴気）実装に向けた課題整理

- プレイヤー被ダメージと同期して敵ダメージを積むための情報不足
  - `player-damage` ステージ生成時に、攻撃者IDとヒット数/ダメージ量を持っている必要がある。`DamageAnimationEvent` や `EnemyTurnActionSummary` に攻撃者情報・ヒット数が無ければ拡張する。
  - `OperationRunner.attachSimpleEntryAnimation` で player-damage を積む箇所に、同バッチで enemy-damage を追加できる拡張ポイントが必要（現状はプレイヤー被弾と敵被弾が別経路）。

- defeat / victory の優先度
  - 同一バッチで player HP0 と敵全滅が同時発生し得るため、`appendBattleOutcomeIfNeeded` などの判定順序を「defeat優先」に固定することを確認・必要なら調整する。

- 状態異常「ダメージ連動」
  - magnitude なし、ターン開始で自壊（StackedStressState類似）する State を追加。
  - プレイヤー被弾時、付与済みの敵全員に同量のダメージを与え、`player-damage` バッチに enemy-damage を積む処理を実装する必要がある。
  - enemy-damage 経由でも defeat / victory 演出が普通の攻撃時と同様に流れるよう、ダメージイベント→defeatイベント→victory判定の流れを崩さない。

- スキルカード「命の鎖」
  - 敵単体に「ダメージ連動」を付与する Skill を追加（カード定義・記憶カード化・ライブラリ登録）。トリガーはプレイヤー被弾時なので、Action側で完結せずバトルの player-damage ステージ生成時に処理するのが安全。

- 状態異常「瘴気」
  - プレイヤーが保持する BadState。`onTurnStart` で自傷（magダメージ）。
  - プレイヤー被弾時、攻撃してきた敵に「攻撃回数 × mag」の瘴気ダメージを与える。攻撃者IDとヒット数を player-damage ステージから取得できるようにする必要がある。
  - 瘴気ダメージ用の Damages を生成し、type/effectType を区別（必要ならサウンド分岐も）。
  - 同バッチで enemy-damage を積む際の defeat/victory 判定も通常攻撃同様に動くことを確認。

- スキルカード「瘴気」
  - プレイヤーに瘴気を付与する Skill を追加（カード定義・記憶カード化・ライブラリ登録）。

- 表示・演出
  - enemy-damage を player-damage と同バッチに積んだ場合でも `DamageEffects` が混線しないよう、batchId/metadata の整理が必要。
  - 「瘴気」「ダメージ連動」のアイコン・description を用意し、UI で表示できるようにする。
