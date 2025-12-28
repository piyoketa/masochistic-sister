# アクティブレリック実装リプラン（再読込み版）

## 目的とスコープ
- プレイヤーの入力として「レリック起動(play-relic)」を正式に扱い、OperationLog → ActionLog → Battle → Animation の経路で整合的に再生できるようにする。
- レリック側に ActiveRelic 基底クラスを用意し、使用回数・マナコスト・起動可否判定・状態保存/復元を共通化して、個別レリックは効果定義に集中できる形にする。
- バトル画面でレリックの残回数/コスト/使用可否を表示し、クリックでターゲット選択などの追加操作を経て発動できる UI/入力フローを整備する。

## 現状確認（コードベース）
- レリック表示/保存: `BattleSnapshot.player.relics` には `{ className, active }` のみ。`captureFullSnapshot` で `relicStates` を保存するが、用途は受動的 relic の状態のみ。残回数やコスト情報は露出していない。
- ログ/Runner: `ActionLog` / `OperationLog` / `OperationRunner` / `OperationLogReplayer` / `ViewManager` は `play-card` と `end-player-turn` だけを扱い、レリック起動経路は未実装。`BattleView.handleRelicClick` は no-op。
- レリック定義: `usageType='active'` は `SacrificialAwarenessRelic` のみだが、起動処理・回数管理・コストやアクション紐付けは未実装。「贄」State も未定義。
- 表示データ源: バトル画面ヘッダーのレリック表示は `playerStore.relics` を `mapClassNamesToDisplay` で変換しており、バトルスナップショットに依存していないため、戦闘中の残回数/使用可否は反映されない。
- 戦闘側ユーティリティ: `Battle` に `hasRelic` / `hasActiveRelic` / `getRelicById` はあるが、起動用メソッドやアニメ演出記録は存在せず、レリックのマナ消費は `Player.spendMana` 経由でしか呼ばれていない。

## 実装ステップ
1. **ActiveRelic基盤と型整備**
   - `Relic` を拡張する `ActiveRelic` 抽象クラスを新設し、`usageLimitPerBattle`・`manaCost`・`createAction(context)`・使用済み回数の保存/復元を実装する。
   - マナ消費と使用上限の更新を基底で扱い、`canActivate` / `perform` で Battle/Player コンテキストと Operation 解決済み情報を受け取れるようにする。
   - `RelicId` 型を `Library` 相当のモジュールに定義し、カード同様に id ベースで参照できるようにする。`SacrificialAwarenessRelic` を ActiveRelic に載せ替え、起動先 Action/State との接続口を用意する（効果は後述の不明点参照）。

2. **Battle/Runner/Log パイプ拡張**
   - `ActionLogEntry` / `OperationLogEntry` に `type: 'play-relic'` を追加（`relicId` と `operations` はカードと同形式の ValueFactory を許容）。
   - `OperationRunner.playRelic` を追加し、前後スナップショット取得・`battle.executeActionLog` 呼び出し・`postEntrySnapshot` 付与をカード同等に行う。アニメーションメタデータに `stage: 'relic-activate'`（暫定）を付ける。
   - `Battle.applyActionLogEntry` / `executeActionLog` に `play-relic` を追加し、所持チェック → ActiveRelic 型判定 → マナ/回数ガード → Action.perform 実行 → アニメイベント記録を行う。`ActionLogReplayer` / `OperationLogReplayer` / `ViewManager.executeOperationWithRunner` / `resolveActionLogEntry` にも新種別を伝搬する。

3. **スナップショット拡張と表示変換**
   - `BattleSnapshot.player.relics` を `{ className, id, name, usageType, active, usesRemaining?, manaCost?, usable? }` 相当まで拡張し、`captureFullSnapshot` と `restoreFullSnapshot` で ActiveRelic の使用回数を `relicStates` に保存・復元する。
   - `relicDisplayMapper` を拡張してスナップショット由来の残回数/コスト/使用可否を UI へ渡す。既存の `mapClassNamesToDisplay` はフィールド用に残しつつ、バトル表示はスナップショット経由へ切り替える。
   - スナップショット生成時に「次のプレイヤー入力で使用可能か」を `usable` へ埋め、View 側のプレチェックで disable 判定に利用する。

4. **入力/ビュー統合**
   - `PlayerInput` / `ViewManager.convertInputToOperation` に `play-relic` を追加。`BattleView.handleRelicClick` から `queuePlayerAction` を呼び、ターゲット選択が必要な場合は既存のカード用 Operation リクエストと同じフローで解決できるようにする。
   - `RelicList` / `PlayerStatusHeader` / `MainGameLayout` をバトル用スナップショットに差し替え、使用可否に応じた押下可否や残回数表示を追加。右クリックキャンセル・入力ロック時の無効化もカードと同等に適用する。
   - アニメーション: `OperationRunner` の `attachPlayCardAnimations` 相当を流用しつつ、レリック用ステージを分岐させ、効果に応じた SE/CutIn の差し替え余地を残す。

5. **テスト**
   - ドメイン: ActiveRelic のマナ消費/回数制限/保存復元、`Battle.playRelic` のガード（未所持・使用上限超過・マナ不足）と Action 連携をユニットテストする。
   - ログ/Runner: `OperationLogReplayer` が `play-relic` を含む操作列を ActionLog に変換できること、`OperationRunner` が前後スナップショットとアニメメタデータを付与することを検証する。
   - View/Integration: レリッククリック → ターゲット選択 → アニメーション再生 → スナップショット更新のハッピーパス、使用不可時の disable/エラーメッセージ表示、Undo/リプレイ時に残回数が巻き戻ることを確認する。不要になった UI 分岐や props は削除して簡潔に保つ。

## 決定事項
- 「贄の自覚」は新しい状態異常「贄」を実装し、自己付与する。
- バトル中のレリック表示は BattleSnapshot 由来へ切り替え、残回数/usable/コストを反映する（フィールド表示は従来の store ベースを継続）。
- 起動可能タイミングはプレイヤーターンかつ input.locked=false の時のみ。必要に応じて個別レリックの `canActivate` で緩和する。
