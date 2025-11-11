# 型チェック修正計画

## ゴール
- `npm run type-check`（`vue-tsc --build`）を完全に通過できる状態に戻し、追加開発時の足かせを排除する。
- 既存の Vue コンポーネント / ドメイン層 / テストコードに散在する型エラーを分類し、影響範囲ごとに段階的な修正方針を定義する。

## 現状のエラー整理
`/tmp/typecheck.log` に採取した結果から抜粋し、重複のない単位で整理した（エラー数 40+）。

|分類|ファイル（行）|概要|想定原因|
|---|---|---|---|
|View: BattleEnemyArea|src/components/battle/BattleEnemyArea.vue:268|`enemyCardRefs[index]` を `Element | ComponentPublicInstance` として扱っており、`EnemyCard` の公開メソッド `playDamage` を呼べない|template ref の型定義が HTMLElement ベースで、コンポーネントインスタンスに狙いを合わせられていない|
|View: BattleHandArea (1)|同:211|`CardType` が `'attack' \| 'skill' \| 'status'` に限定されているのに、skip カードを含めた union を渡している|`Card` 側では `skip` が存在するため View との型齟齬が発生|
|View: BattleHandArea (2)|同:608/610|`request` が `null` の場合を考慮しておらず `possibly undefined`|optional chaining不足|
|View: BattleHandArea (3)|同:778|`DOMRect` と `{ left, top, ... }` の union を `DOMRect` へ代入|独自矩形型を DOMRect に代入している|
|View: BattleHandArea (4)|同:981|`handleHandContextMenu` が存在しないのにテンプレート側で参照|リファクタ時の取りこぼし|
|View: BattleHandArea (5)|同:1003|`ref` から取得した値が `Element \| Component` union のまま DOM API に渡されている|`HTMLElement` へ絞り込みが必要|
|View: BattleView|src/views/BattleView.vue:630 前後|`StageEventPayload` 内の `EnemyTurnActionSummary` 定義と実際の `enemyActions` オブジェクトが不一致（敵 snapshot の型も State[] を要求）|`Battle.notifyActionResolved` の戻り値とステージイベント型定義の乖離|
|Domain: OperationRunner (1)|src/domain/battle/OperationRunner.ts:194|`Battle.consumeDamageAnimationEvents()` を private のまま呼び出し|Battle 側 API のアクセス制御ミス|
|Domain: OperationRunner (2)|同:288|`EnemyTurnActionSummary` を `Record<string, unknown>` に代入|`BattleLogEntry` の型を `Record<string, unknown>` に限定している|
|Domain: battlePresets|src/domain/battle/battlePresets.ts:62 以降|Deck builder の戻り型が `DeckBuilderResult` に合致せず `DefaultDeckResult` などを返却|型 alias の差し替え / extends 不備|
|Domain: SkipTurnAction|tests でも多数|`SkipTurnAction` の `type` が `'skip'` で `ActionType`（'attack'/'skill'）と齟齬|ActionType の設計が skip を想定していない|
|Tests: BattleEnemyArea.spec|tests/components/BattleEnemyArea.spec.ts:41|`image`/`skills` など `EnemyInfo` 必須プロパティ不足|テストデータの型未更新|
|Tests: BattleHandArea.spec|tests/components/BattleHandArea.spec.ts:121,157,223,227|ジェネリクス引数過多、`undefined` 可能性未処理|Vue Test Utils の API 変更追従漏れ|
|Tests: action specs|tests/domain/action/ActionBase.spec.ts ほか|Duplicate identifier|`vitest.mock` で同一モジュールを2回 import している or tsconfig で同ファイルを二度コンパイルしている（`.spec.ts` 同名?）|
|Tests: attackDamages / enemyScheduler|SkipTurnAction を `Action` として渡せず型エラー|前述 ActionType 問題に起因|
|Tests: BattleView.spec|retry/undo ボタンが `undefined` になりうる|`find` 結果の null チェック不足|

※ログ終端で `StageEventPayload` 関連エラーが繰り返し出力されているため、`ResolvedBattleActionLogEntry` 周りの型見直しも必要。

## 対応方針とステップ
1. **型定義の土台修正**
   - `CardType` / `ActionType` に `skip` を含めるか、Skip 系カードを View / テストから排除するか方針決定。
   - `EnemyTurnActionSummary`, `StageEventPayload`, `BattleLogEntry` など共通型を整理し、`State[]` を要求する箇所ではダミー state でも `State` インターフェースを実装する helper を用意。
   - `Battle.consumeDamageAnimationEvents` を public にするか、OperationRunner からの参照経路を `battle['consume...']` から `battle.flushDamageAnimations()` など public ラッパーで吸収。

2. **ビュー層の型修正**
   - BattleEnemyArea: template ref の型を `InstanceType<typeof EnemyCard> | null` にし、`HTMLElement` との共存をやめる。
   - BattleHandArea: 上記 5 件の個別修正（`CardType` union、optional chaining、`DOMRectReadOnly` に寄せる、メソッド追加 or イベント除去、`instanceof HTMLElement` ガード）。

3. **ドメイン / ビルダー**
   - `battlePresets` の戻り値を `DeckBuilderResult` 構造に合わせる（`{ deck, description }` など共通キーを整備）。
   - `OperationRunner` で `EnemyTurnActionSummary` を `Record<string, unknown>` に変換する helper を挟むか、ログエントリ型のジェネリクスを導入。

4. **StageEventPayload / Snapshot 連携**
   - `EnemyTurnActionSummary` が `BattleSnapshot` を保持するときの型エイリアスを `SerializableEnemySnapshot` に変更し、`State[]` 要求へ合わせるために `State` ダミーを `PlainState` クラスで生成。

5. **テスト修正**
   - `BattleEnemyArea.spec` などの fixture を `EnemyInfo` 完全形に更新。
   - `BattleHandArea.spec` の Vue Test Utils API 呼び出しを型に沿うよう `mount<typeof Component>(...)` へ改修、`undefined` チェック追加。
   - Duplicate identifier は import の二重列挙を解消（`vitest.mock` で同ファイル2度読み込み回避、もしくは type-only import）。
   - SkipTurnAction を使うテストでは `Action` 依存を避けて `Action` モッククラスを定義する、または `ActionType` へ `'skip'` を追加したうえで実装も対応。

6. **最終確認**
   - `npm run type-check` → `npm run test:unit` で後続エラーがないかを検証。

## 不明点・意思決定が必要な事項
1. **Skip アクションの扱い**
   - 選択肢A: `ActionType` / `CardType` に `'skip'` を正式追加し、`SkipTurnAction` を正規化する。
   - 選択肢B: `SkipTurnAction` を `Action` 継承ではなく別クラスへ切り出し、ログやテストではモック化する。
   - **提案**: 選択肢A（`skip` を型に追加）。現状既にカード定義が存在し、View/テストでも利用しているため、例外扱いは複雑化リスクが高い。

2. **Enemy snapshot の State 表現**
   - 選択肢A: `State` インターフェースを満たす軽量モック（`PlainState`) を導入し、snapshot にはモックを流す。
   - 選択肢B: snapshot 用の別型（`EnemyStateView`) を導入し、`EnemyTurnActionSummary` なども View 専用型を参照する。
   - **提案**: 選択肢A。既存メソッドが `State` のメソッドを期待している箇所が多く、派生型を分けると型変換コストが増えるため。

3. **OperationRunner のログ payload**
   - 選択肢A: `Record<string, unknown>` をジェネリクスに変え、`EnemyTurnActionSummary` をそのまま格納する。
   - 選択肢B: `EnemyTurnActionSummary` を `Record<string, unknown>` へ serialize する utility を噛ませる。
   - **提案**: 選択肢A。ログコンシューマが型安全にアクセスできるようにするにはジェネリクス化が自然。既存呼び出しには `Record<string, unknown>` をデフォルト型引数に用意すれば後方互換も保てる。

4. **BattleEnemyArea のテンプレート参照**
   - 選択肢A: `shallowRef<InstanceType<typeof EnemyCard> | null>` を使用。
   - 選択肢B: DOM のみ保持し、`playDamage` 必要箇所では `events` を親へ伝える。
   - **提案**: 選択肢A。`playDamage` を直接呼ぶ意図が既にあるため、コンポーネントインスタンス参照を型安全に保持する方向が低コスト。

上記不明点についてご意見をいただき次第、具体的な修正に着手できます。現在優先度が高いのは **Skip アクションの型定義** と **EnemyTurnActionSummary / StageEventPayload の再定義** です。ここが固まれば、残りの View / テストの細かな修正は機械的に対応できます。
