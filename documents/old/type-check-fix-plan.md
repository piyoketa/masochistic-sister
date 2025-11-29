# 型チェック修正計画（2024-05-23 更新）

## ゴール
- `npm run type-check`（`vue-tsc --build`）を確実に通過できる状態へ戻し、開発時のフィードバックループを正常化する。
- View / ViewModel / Domain / Test の層ごとに型崩れの原因を把握し、依存関係を意識した順序で修正を進める。

## 既決事項（ユーザー回答反映済み）
- Skip アクションは `CardType` / `ActionType` に正式追加する（選択肢A）。
- Enemy snapshot の `State` 表現は `PlainState` など軽量実装で `State` 契約を満たす（選択肢A）。
- OperationRunner のログ payload はジェネリクスで型安全に扱う（選択肢A）。
- BattleEnemyArea のテンプレート参照は `EnemyCard` インスタンスを保持する（選択肢A）。

## 調査状況
- 2024-05-23 付で `npm run type-check` を実行し、`/tmp/typecheck.log` に 300 行超のエラーを取得。View/Composable だけでなく、Action ログ・デッキプリセット・多数のテストに波及していることを確認した。

## 現状のエラー分類

### A. View / Composable 層
- `CardList.vue`: `CardInfo` に `affordable`/`disabled` フラグが存在しないため `ActionCard` へ渡せない。
- `BattleEnemyArea.vue`: `enemyCardRefs` が `Element | ComponentPublicInstance` となっており、`playDamage` など子コンポーネント API を安全に呼べない。
- `useHandPresentation.ts`: `CardInfo` と `CardType` が `'skip'` を含まず、手札整形関数で `'skip'` を扱うと型崩れ。カード操作情報の `undefined` ガード不足もある。
- `useHandAnimations.ts`: `UseHandAnimationsOptions` から `variant` が欠落、`fromRect` が `{left,top,...}` と `DOMRect` の Union になっており `DOMRect` 専用 API に渡せない。灰化演出で `spawnCardAshOverlay` の import が抜けている。
- `useHandStageEvents.ts`: `current`/`pendingCreateQueue` が `undefined` になる経路のガード不足。`PendingCreateRequest` を Optional 扱いしておらず、`StageEventPayload` のメタデータ読み出しが unsafe。
- `enemyActionFormatter.ts`: `EnemyActionHint.calculatedPattern` に `type` が無いため `action.calculatedPattern?.type` がエラー。

### B. ViewModel / StageEvent
- `ViewManager.ts`: `AnimationCommand`/`AnimationScript` の `metadata` に `entryType` が定義されておらず、再生完了ログでアクセスできない。キュー先頭が無いケースの null ガード不足、`animationDebugLoggingEnabled` フィールドも型に存在しない。
- `StageEventPayload`（`src/types/animation.ts`）と `ResolvedBattleActionLogEntry` の整合が崩れ、`BattleView.vue` や `useHandStageEvents` で `enemyActions` を読むと型不一致になる。

### C. Domain / Entity 層
- `OperationRunner.ts`: `battle.consumeDamageAnimationEvents()` が private、`EnemyTurnActionSummary` を `Record<string, unknown>` へ押し込んでいるため型エラー。敵行動サマリ `metadata` に `snapshotAfter` を格納する際、`State[]` の扱いが決まっていない。
- `battlePresets.ts`: `DefaultDeckResult` などの戻り値が `DeckBuilderResult` のインデックスシグネチャと合致しない。
- `CardDefinition.ts` / `SkipTurnAction.ts`: `SkipTypeCardTag` 未 import、`Skip` カードが `target: SelfTargetCardTag` を要求しているため `SkipCardDefinition` と矛盾。`ActionType` が `'skip'` を許容しないため `HeavenChainAction` 等で `SkipTurnAction` を渡せない。
- `Enemy.ts`: `EnemyActionQueueStateSnapshot` を re-export しておらず import できない。
- `TargetEnemyOperation.ts`: `describeAvailability` で `enemy.id` を number に絞り込めておらず `enemyId: number | undefined` になってしまう。

### D. Utility
- `audioPreloader.ts`: `HTMLAudioElement` に `decode` メソッドは存在しないため optional chaining でも型エラー。
- `damageSounds.ts`: バンド配列からの `find` 結果が `undefined` の可能性を潰せていない。

### E. Tests / Fixtures
- Vue コンポーネント spec: `BattleEnemyArea.spec` のダミー snapshot が `image`/`skills` を欠落。`BattleHandArea.spec` では `findAll()[0]` の `undefined` ガード不足と `createdWrapper` などの null 可能性未処理。
- Domain spec: `ActionBase.spec.ts` / `Attack.spec.ts` / `Player.spec.ts` で同一シンボルを重複 import。Skip アクションを使う `attackDamages.spec.ts` など多数のテストで `ActionType` 不一致が連鎖。`enemyStateStack.spec.ts` は `createEnemyWithStates([])` の型推論が `never[]` になっている。
- Integration / Fixture: `tests/fixtures/battleSample*.ts` や `battleSampleScenario.ts` が `ActionLogEntrySummary` の `card`/`operations` を `never` とみなされ `number` を代入できない。`enemyNextActionSnapshot.spec.ts` や `battleSample.spec.ts` では `entry`/`battle` の暗黙 `any`・`undefined` 取扱が未整理。

## 修正方針とステップ
1. **共有型の整備と基盤調整**
   - `src/types/battle.ts` の `CardType` を `'attack' | 'skill' | 'status' | 'skip'` に揃え、`CardInfo` へ `affordable`/`disabled` を追加。`EnemyActionHint.calculatedPattern` に `type` を許容。
   - `src/types/animation.ts` にステージ種別毎のメタデータ型を定義し、`StageEventPayload` が `entryType`・`resolvedEntry` と矛盾しないよう整理。
   - `ActionLogReplayer` / `Battle` 側で `EnemyTurnActionSummary` が保持する `snapshotAfter` の `states` を `PlainState`（`State` を満たす軽量実装）で包む。

2. **Domain 層の型矛盾解消**
   - `ActionType` / `CardDefinition` / `SkipTurnAction` / `HeavenChainAction` を `'skip'` 対応にアップデート。`SkipCardDefinition` から `target` を外し、`SkipTypeCardTag` を import。
   - `EnemyActionQueueStateSnapshot` を index から再エクスポートし、`Enemy.ts` の import を解決。
   - `TargetEnemyOperation.describeAvailability` を type predicate 化し、`enemyId` を必ず number へ絞る。
   - `battlePresets` の builder 戻り値を `DeckBuilderResult` の shape（`{ id, label, deck, description }` 等）へ揃える。
   - `Battle` に公開メソッド（例: `drainDamageAnimationEvents`）を用意し、`OperationRunner` から private メソッドを叩かない。`OperationRunner.appendEntry` をジェネリクス化し、`EnemyTurnActionSummary` を `metadata` に安全に入れられるようにする。

3. **ViewModel / StageEvent 処理の再統合**
   - `AnimationCommand`/`AnimationScript` の `metadata` に `entryType` や `resolvedEntry` を保持し、`ViewManager` 内で `command` が `undefined` の場合を明示的にスキップする。
   - `latestStageEvent` の生成箇所（`BattleView.vue`・`useHandStageEvents.ts`）を更新し、`ResolvedBattleActionLogEntry` の `enemyActions` 型と一致させる。

4. **View / Composable 修正**
   - `CardList.vue` で `CardInfo` へ追加したフラグを利用。`BattleEnemyArea.vue` は `shallowRef<InstanceType<typeof EnemyCard> | null>` に切り替え、`playDamage` 呼び出し時の null ガードを追加。
   - `useHandPresentation`・`useHandAnimations`・`useHandStageEvents` で新しい型を参照し、`DOMRectReadOnly` 互換の Rect helper を導入。`spawnCardAshOverlay` を import。
   - `enemyActionFormatter.ts` は `EnemyActionHint` の更新に合わせて `calculatedPattern?.type` を安全に扱う。

5. **Utility 修正**
   - `audioPreloader.ts` は `const maybeDecodable = audio as HTMLMediaElement & { decode?: () => Promise<void> }` のように拡張し、ブラウザ差異を考慮した無視手続きをコメントで明示。
   - `damageSounds.ts` は `band ?? bands[bands.length - 1]!` の後にガードを入れ、空配列の場合は例外を投げる。

6. **テスト/フィクスチャ更新**
   - Component spec: Snapshot factory / wrapper で `image`/`skills` など必須プロパティを補完し、`findAll()[index]` を `at` + `expect` で安全化。
   - Domain spec: 重複 import を削除し、SkipAction への参照は更新された `ActionType` に任せる。`enemyStateStack.spec` の `states = [] as State[]` のように初期値へ型注釈を追加。
   - Integration / Fixtures: `ActionLogEntrySummary` の `card`/`operations` を Conditional Type ではなく `unknown` ベースに書き直し、必要に応じてジェネリクス化。`battleSampleScenario` などの helper には `battle: Battle` 型注釈を付け、`enemyNextActionSnapshot` のループでは `const entry = entries[index]` 後に `if (!entry) continue`.

7. **検証**
   - 上記完了後に `npm run type-check` → `npm run test:unit` の順で確認し、残差エラーがあれば分類し直す。

## 不明点・意思決定が必要な事項
- 現時点で新たに人間の判断を仰ぐ項目はありません（既存の 4 件はすべて選択肢Aで確定済み）。進める中で追加の仕様不明点が見つかった場合は随時共有します。
