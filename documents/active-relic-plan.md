# アクティブレリック導入計画

## 目的と前提
- プレイヤー操作に「play-relic」を追加し、OperationRunner/ActionLog を経由してレリックの起動効果を再現できるようにする。
- ActiveRelic 基底クラスで「1 戦闘 1 回制限」「マナコスト」「起動可否判定」を共通化し、各レリックはプロパティ指定と Action 参照だけで効果を実装できる状態にする。
- UI はカードと同じタイミングでレリックをクリックし、必要ならターゲット選択/手札選択を伴う Operation を発行できるようにする。

## 現状の整理（課題）
- OperationRunner / ActionLog / OperationLog は `play-card` と `end-player-turn` のみ対応で、レリック起動が通る経路が存在しない。
- BattleSnapshot のレリック情報は `{ className, active }` だけで、起動回数やコスト充足可否を表示・判定する材料が欠けている。
- Relic は `usageType: 'active'` を持つが、使用状態や効果処理の実体（perform 相当）が存在せず、戦闘中の使用回数・マナ消費も管理されていない。
- フロントの入力モデル（PlayerInput）/UI はレリッククリックを受けても Operation を生成していないため、操作キューに乗らない。
- アニメーション・ログ演出はカード前提で設計されており、レリック用の前後スナップショット差し替えや SE 指示が不足している。

## 実装ステップ案
1. **ActiveRelic 基底クラスの設計**
   - `usageLimitPerBattle`（`number | null`）、`manaCost`（`number | null`）、`actionRef`（Action インスタンスまたはファクトリ）を持たせる。
   - 戦闘ごとの使用回数カウンタと、消費マナ計算・支払い（Player.spendMana 連携）を基底で実装。`saveState/restoreState` でカウンタを BattleSnapshot の relicStates と同期。
   - `perform`（or `activate`）で Action を呼び出し、TargetEnemyOperation / SelectHandCardOperation をそのまま渡せるようにする。

2. **Battle/ActionLog/OperationRunner の経路拡張**
   - ActionLogEntry/OperationLogEntry に `play-relic` を追加（`relicId` + `operations`）。`OperationRunner.playRelic` を新設し、`appendEntry` で前後スナップショット・アニメーションを付与。
   - Battle 側に `playRelic` を追加し、(1) 所持確認、(2) ActiveRelic かどうか、(3) 使用上限/マナ可否チェック、(4) Action 実行、(5) カウンタ更新/マナ消費/アニメイベント記録 を行う。
   - `applyActionLogEntry` が `play-relic` を解釈し、OperationLogReplayer/ViewManager.executeOperationWithRunner も同型を処理するようにする。
   - PlayCard 相当の AnimationInstruction を流用しつつ、必要なら `stage: 'relic-activate'` 等のステージを追加し、postEntrySnapshot をセット。

3. **Snapshot 拡張と ViewModel 層対応**
   - `BattleSnapshot.player.relics` に `usesRemaining`（null: 無制限）、`manaCost`、`usable`（ターン/マナ/回数など総合判定）を追加。
   - `FullBattleSnapshot.relicStates` に ActiveRelic のカウンタを保存し、巻き戻し/リプレイで使用回数が再現されるようにする。
   - `relicDisplayMapper` で追加情報を受け取り、UI へ活性/残回数/コスト表示を渡す形へ拡張。

4. **フロント入力フロー**
   - PlayerInput/OperationLogEntry へ `play-relic` を追加し、`BattleView.handleRelicClick` → `ViewManager.queuePlayerAction` で Operation 化する。
   - ActiveRelic が要求する Operation（敵/手札選択など）を ViewManager がカード時と同じ方式で組み立てられるよう、Action 側の Operation 宣言をカード/レリック共通インターフェース化する。
   - キャンセル操作（右クリック）の既存ハンドリングをレリック選択中にも適用する。

5. **テスト計画**
   - ドメイン単体テスト: ActiveRelic の使用回数・マナ消費・保存/復元、`play-relic` ActionLogEntry の適用結果。
   - OperationLogReplayer テスト: `play-relic` を含む OperationLog で ActionLog を構築できること、使用上限超過時にエラーになること。
   - View/Integration: クリック→ターゲット選択→アニメーション→スナップショット更新までのハッピーパス、マナ不足/回数切れの UI 表示（disable/エラー）確認。

## 仕様の不明点と選択肢
1. **OperationLog で指定する識別子**
   - 選択肢: (A) `relicId`（Relic.id）、(B) `relicClassName`、(C) 両方許可して優先順位を決める。
   - -> A のみ**。所持リストは id で一意性を担保しているため、OperationLog も id で統一。CardIdと同様、RelicIdもTypeScriptの型として定義してください。

2. **Snapshot 表示用の「active」意味付け**
   - 選択肢: (A) 現在使用可能（マナ/回数/ターン条件を満たす）、(B) 恒常的にオンオフを示すだけで使用可否は別フィールド、(C) 両方を別フィールドで持つ。
   - -> A。

3. **アニメーションステージの扱い**
   - 選択肢: (A) `play-card` と同じ `play-card` ステージを流用、(B) 新規 `play-relic` ステージを追加、(C) まずはなし（snapshot 更新のみ）。
   - -> B。カードと混同しないステージを追加しつつ、初期は音/演出を簡素にする。

4. **ActiveRelic の Action 参照方法**
   - 選択肢: (A) `Action` インスタンスをプロパティとして持つ、(B) ファクトリ関数で必要時に生成、(C) Action class name からリポジトリ経由で生成。
   - -> **B**。使用毎に Battle/Player コンテキストを与えて生成し、副作用やターン依存の一時状態を持ち込まないようにする。

5. **使用制限エラー時の挙動**
   - 選択肢: (A) OperationRunner/Battle が例外を投げて入力を巻き戻す、(B) ViewManager が pre-check して Operation 未生成、(C) 両方実装。
   - -> **C**。UI で事前 disable/警告しつつ、ドメインでも例外でガードする二重防御。

この計画で問題なければ実装に着手します。修正・追加要望があれば教えてください。

## 変更する基本的な型・インターフェース仕様（実装前の確定版）
実装に着手する前に、変更点を型レベルで固定します。既存プロパティの互換性は維持し、列挙にない部分は従来通りとします。

- OperationLogEntry（`src/domain/battle/OperationLog.ts`）
  - 追加: `{ type: 'play-relic'; relicId: ValueFactory<string>; operations?: Array<{ type: CardOperation['type']; payload?: ValueFactory<CardOperation['payload']> }> }`
  - 備考: `relicId` は Relic.id を使用（例: `sacrificial-awareness`）。operations はカードと同形式でターゲット/手札選択を保持。

- BattleActionLogEntry（`src/domain/battle/ActionLog.ts`）
  - 追加: `{ type: 'play-relic'; relic: ValueFactory<string>; operations?: Array<{ type: CardOperation['type']; payload?: ValueFactory<CardOperation['payload']> }> }`
  - 備考: `postEntrySnapshot` 必須。アニメーション待機時間計算はカードと同等ルールを適用。

- OperationRunner パブリック API（`src/domain/battle/OperationRunner.ts`）
  - 追加メソッド: `playRelic(relicId: string | number, operations?: PlayCardOperations): number`
  - アニメーション: `appendEntry` で `play-relic` も前後スナップショットを取得し、`play-relic` 用ステージ（`relic-activate`）を付与するか、カード演出を流用する分岐を持つ。

- Battle（`src/domain/battle/Battle.ts`）
  - applyActionLogEntry に `case 'play-relic'` を追加し、解決済み relicId と operations を `playRelic` へ渡す。
  - 新メソッド: `playRelic(relicId: string, operations?: CardOperation[]): void`
    - 所持/usageType チェック、ActiveRelic 判定、使用上限・マナコストチェック、マナ支払い、回数更新、Action.perform 呼び出し、アニメイベント記録を行う。

- BattleSnapshot / FullBattleSnapshot（`src/domain/battle/Battle.ts`）
  - `player.relics` を拡張:
    - `className: string`（既存）
    - `active: boolean`（既存、永続効果 ON/OFF 意味で継続）
    - `usageType: RelicUsageType`（表示用）
    - `usesRemaining?: number | null`（null=無制限）
    - `manaCost?: number | null`
    - `usable?: boolean`（マナ/回数/ターン条件を満たすかの総合判定）
  - `relicStates`: 既存の `{ className: string; state: unknown }` を ActiveRelic のカウンタ保存にそのまま利用。

- Relic / ActiveRelic（`src/domain/entities/relics/Relic.ts` 予定）
  - ActiveRelic プロパティ:
    - `usageLimitPerBattle: number | null`
    - `manaCost: number | null`
    - `createAction: (context: { battle: Battle; player: Player }) => Action`
  - ActiveRelic メソッド:
    - `canActivate(context): boolean`（マナ/回数/任意条件の合否）
    - `perform(context, operations?: CardOperation[]): void`（内部でマナ消費・回数更新後 Action.perform 呼び出し）
    - `saveState/restoreState`: 使用済み回数カウンタをシリアライズ/デシリアライズ。

- PlayerInput / ViewManager.convertInputToOperation（`src/view/ViewManager.ts`）
  - 追加: `{ type: 'play-relic'; relicId: string; operations?: CardOperation[] }`
  - 備考: BattleView でレリッククリックをこの入力に変換し、OperationLog へ積む。

- AnimationStageMetadata（`src/domain/battle/ActionLog.ts`）
  - 追加ステージ（暫定案）: `{ stage: 'relic-activate'; relicId?: string; relicName?: string }`
  - 備考: 初期はカード演出を流用してもよいが、ステージを追加しておくことで SE/演出差分を後付け可能にする。
