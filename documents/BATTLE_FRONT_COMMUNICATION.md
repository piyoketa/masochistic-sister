# Battle ↔ Front 通信整理メモ

## 1. 現状の通信パス
### Battle → ViewManager → BattleView
1. **ActionLogEntry + AnimationInstruction**  
   - `OperationRunner` が ActionLogEntry を生成し、アニメーション命令（`AnimationScript`）を `ViewManager` へ push。  
   - `ViewManager` が `BattleView` にイベント（state / animation-start / animation-complete）を通知し、`BattleView` は命令を再生。
2. **BattleSnapshot (postEntrySnapshot)**  
   - ActionLogEntry には `postEntrySnapshot: BattleSnapshot` が付与され、View はこれをアニメーション中に参照して描画更新。

### View → Battle
1. **OperationLog 経由のプレイヤー操作**  
   - `BattleView` が `ViewManager.queuePlayerAction` を呼び、`OperationLogEntry` が `OperationRunner` に渡る。
2. **直接参照系**  
   - `BattleEnemyArea` が `battle.enemyTeam.findEnemy()` を通じて `Enemy` 実体を参照（次行動の把握など）。  
   - 一部 UI（天の鎖など）が `Battle`/`Enemy` を直接参照して状態チェックを行う。

## 2. 統一方針・残課題
### 目標
- **Battle → Front** を ActionLogEntry（＋AnimationInstruction）だけに絞り、UI は `BattleSnapshot` から必要情報を取得する。  
- **Front → Battle** は OperationLogEntry のみに統一し、フロントからドメインオブジェクトを直接触らない。

### 現状の課題
| 経路/用途 | 問題点 | 統一案 |
| --- | --- | --- |
| `BattleEnemyArea` が `battle.enemyTeam.findEnemy()` を参照 | アニメ再生中に「最新の」`Enemy` 状態を参照してしまい、ActionLog との時差が出る | 行動予測を `BattleSnapshot` に含め、`BattleEnemyArea` は snapshot のみ参照 |
| カードによる `Enemy` 直接操作（例: 天の鎖） | UI から `Enemy` を直接操作・参照 | OperationLog の “カード効果” で完結させ、View は操作理由を表示するだけにする |
| ViewManager が `Battle` インスタンスを保持し一部 UI が参照 | snapshot とリアルタイム状態が混在 | `ViewManager.state.snapshot` を唯一の描画ソースにし、`battle` への直接参照は避ける |

## 3. 敵の行動予測問題の整理
- `BattleSnapshot` に敵の行動予測（Next Action）を含めていないため、`BattleEnemyArea` は毎回 `battle.enemyTeam.findEnemy()` 経由で “現在の” キューを読み取っている。  
- `OperationRunner` は `end-player-turn` の直後に `start-player-turn` エントリを追加するので、敵フェイズ演出の最中でも `Enemy` 実体は「次ターン状態」へ更新済み。結果として表示が先走る。

### 改修案（最新方針）
1. **行動予測は Battle インスタンスから直接取得**  
   - Snapshot に `nextActions` を詰め込むのはやめ、フロントは `Battle.enemyTeam.findEnemy()` と `enemyActionHintBuilder` を通じて、現在ターンの行動予測を逐次取得する。  
   - 乱数シードをキュー生成時に保持しているため、リプレイ時も同じ行動列が得られる。
2. **View は Snapshot + Battle の併用**  
   - 描画の基礎データは引き続き `BattleSnapshot` を利用しつつ、行動予測だけは `Battle` を参照して計算する。  
   - `hasActedThisTurn` は Snapshot 側で保持し、予測表示の抑制に利用する。
3. **OperationRunner / ActionLog**  
   - ActionLogEntry は従来通り Snapshot を保存するが、行動予測は含まない。  
   - 乱数シードと敵キューの派生シードを Battle 初期化時に固定し、リプレイでも同じ予測が得られるようにする。

この方針により、行動予測の表示は「常に最新の Battle 状態に基づく」一方で、乱数シードを固定することでリプレイ時の決定性を確保する。

---

## 3-1. 詳細実装計画
1. **データ構造拡張**
   - `BattleSnapshot` と `FullBattleSnapshot` に `enemies[].nextActions?: Array<{ id: string; title: string; type: 'attack' | 'skill' | 'skip'; metadata? }>` を追加。
   - `captureFullSnapshot()` で `enemyActionQueue.peek()` から取得した行動を整形し、`nextActions` に格納。
   - `FullBattleSnapshot.enemyQueues` とは別に、描画専用の軽量データにする（オブジェクト参照をそのまま渡さない）。

2. **OperationRunner 側の調整**
   - ActionLogEntry を生成する際、`postEntrySnapshot` は `BattleSnapshot`（`captureFullSnapshot().snapshot`）を使用するため、ここで自動的に `nextActions` が埋まる。
   - `enemy.actionQueue` に対し、行動変更（discard, prepend など）の後に `markSnapshotDirty` 的な処理を差し込み、次回 snapshot 取得時に最新の nextActions が反映されるようにする。

3. **View 層の変更**
   - `ViewManager`/`BattleView` は従来通り `state.snapshot` を `BattleEnemyArea` へ渡す。`BattleEnemyArea` は `enemySnapshot.nextActions` を参照し、`battle` 実体にはアクセスしない。
   - `EnemyCard` など、敵のステータスや行動を表示するコンポーネントは snapshot ベースで描画。

4. **テスト/互換性**
   - `BattleSnapshot` の構造が変わるため、`snapshot` を fixture として使っているテストを全て更新。
   - Integration テストで `nextActions` が正しいタイミングで変化するかを検証（敵ターン中は変わらない、プレイヤーターン開始で更新される等）。

## 3-2. 想定される課題・不明点
1. **snapshot サイズ増大**  
   - `nextActions` を含めることで `BattleSnapshot` が肥大化する。ActionLog が長いバトルでメモリ・シリアライズコストが増えるため、必要最小限の情報（タイトル、種別、対象など）に絞る設計が必要。
2. **ActionLog の互換性**  
   - 既存の ActionLog fixture を全更新する必要がある。過去のログとの互換性をどう扱うか（例: migrate script を用意するか）を決める必要がある。
3. **行動キューの参照タイミング**  
   - `captureFullSnapshot()` が呼ばれる頻度が高いため、`EnemyActionQueue.peek()` を多用するとパフォーマンスに影響する恐れあり。`nextActions` をキャッシュし、行動変更時のみ再計算する仕組みが必要。
4. **特殊な行動書き換え**  
   - 天の鎖などで敵行動を強制的に書き換える場合、`nextActions` の更新タイミングが複雑になり得る。OperationLog による効果適用と snapshot 更新の順序を明確にする必要がある。
5. **hasActedThisTurn との整合**  
   - 行動済みの敵に `nextActions` を持たせるか否かの仕様決定（表示側では非表示にする想定だが、snapshot には持っておいた方がデバッグしやすいか）。  
   - `BattleSnapshot` に `enemies[].hasActedThisTurn` を既に持っているか再確認し、なければ追加。
6. **ViewManager/BattleView の参照排除**  
   - 現状一部 UI は `battle` 実体を参照しているので、完全に snapshot だけで描画できるかを事前に洗い出す必要がある（敵行動以外の情報も含めて）。  
   - `ViewManager` が Battle インスタンスを expose している箇所を削減できるか検討が要る。

この課題群を順に解消することで、ActionLogEntry ベースの通信へ統一しつつ、敵行動予測の表示ズレを解消する道筋が明確になります。

### 3-3. Snapshot に情報を「詰め込む」方式を採った場合
**メリット**
- View 層が Battle/Enemy へ直接アクセスせずに済み、描画は `snapshot` だけを見ればよくなる。  
- アニメーション再生タイミングごとに凍結された状態を参照できるため、今回のような時差問題を根本的に防ぎやすい。  
- デバッグやログ解析が容易になる（1つの ActionLogEntry を見れば当時の盤面＋ Next Action を完全再現できる）。

**デメリット**
- Snapshot のサイズ・生成コスト・ActionLog ファイルサイズは確実に増える。今回のブラウザ/環境では許容範囲と考えられるが、長期的にはメモリプロファイルを監視する必要がある。  
- 表示用フォーマット（EnemyActionHint 相当）がドメイン層に移るため、UI 仕様変更がドメインコードへ波及しやすくなる。  
- 既存の ActionLog との互換性確保、マイグレーション（既存テスト fixture の再生成）が必須。  
- Snapshot 生成が重くなることで、OperationRunner や ViewManager のパフォーマンスに影響する可能性がある（特に大量の敵/状態がある場合）。

**対策メモ**
- Snapshot 内に含める情報は「描画に必要な最小限」を定義し、標準フォーマットを固める（例: EnemyActionHint と同等の JSON）。  
- ActionLog fixture 再生成の手順を整備し、差分確認を楽にする（スクリプト自動化など）。  
- 将来的に重くなった場合に備え、Snapshot の圧縮や `nextActions` の省略（必要エントリのみ）などを検討できるようにする。

## 3-4. 改めて整理した実装ステップ
### ステップ1: ドメイン/スナップショット拡張
1. `EnemyActionHint` をドメイン層で生成  
   - `BattleEnemyArea` に存在する `summarizeEnemyAction` ロジックをドメイン側（例: `Battle.buildEnemyActionHints`）へ移動し、UI/ドメインで同一フォーマットを共有。
   - `EnemyActionHint` はダメージパターンや付与ステートなど、EnemyCard が表示している内容を表現できる構造にしておく。
2. `BattleSnapshot` / `FullBattleSnapshot` に `enemies[].nextActions?: EnemyActionHint[]` / `hasActedThisTurn` を追加。
3. `Battle.captureFullSnapshot()` で `enemyActionQueue.peek()` から取得した行動を `buildEnemyActionHints` に通し、`nextActions` に格納。  
   - 行動変更（天の鎖など）後でも Snapshot 生成タイミングで常に最新の ActionHint が計算されるため、追加のフラグは不要。

### ステップ2: View 層を Snapshot 参照に統一
1. `BattleEnemyArea` / `EnemyCard` は `enemySnapshot.nextActions` を描画ソースとし、`battle.enemyTeam.findEnemy()` などの直接参照を撤廃。  
2. `BattleHandArea` の `handLimit` / `OperationContext` / 敵選択ヒントなど、`props.viewManager.battle` に依存している箇所を Snapshot / ViewModel 経由に置き換える。  
   - 例: Snapshot に `handLimit`, `playerActionContext` を含める、または ViewModel が専用の getter を提供し View が Battle 実体を参照しなくて済むようにする。  
3. これらが完了したら、`ViewManager` が `battle` インスタンスを expose する必要がなくなるため、非公開化する。  
4. `EnemyCard` の `formattedActions` は `EnemyActionHint[]` を前提にリファクタし、必要なら `EnemyActionFormatter` を共通化した上でドメインと UI の責務を明確にする。

### ステップ3: テスト&フィクスチャ対応
1. **部分一致比較の導入**  
   - `tests/integration/utils/battleLogTestUtils.ts` に「フィクスチャで指定したプロパティだけ比較する」機構を追加し、Snapshot 拡張時でも既存テストが最小限の修正で済むようにする。
2. **フィクスチャ再生成**  
   - `scripts/updateActionLogFixtures.mjs` を実行して新しい Snapshot を取り込みつつ、部分一致比較を使うことで “必要な項目だけ検証” するテストへ移行。
3. **追加テスト**  
   - 敵ターン中に `nextActions` が変化しないこと、プレイヤーターン開始で更新されることを確認する統合テスト（またはユニットテスト）を用意する。

## 3-5. 現時点の不明点 / 確認事項
1. **EnemyActionHint の責務境界**  
   - 文言やアイコン名まで含め、View からそのまま描画できるフォーマットをドメイン側で生成する。
2. **パフォーマンス計測ポイント**  
   - 明示的な計測は必須ではない。必要になった場合はシナリオ2フルバトルをベンチマークとする。
3. **ViewManager が Battle を expose する理由の切り分け**  
   - どのコンポーネントが `battle` に依存しているのかを洗い出し、Snapshot への完全移行が可能かを確認する。
4. **既存ログとの互換性**  
   - 現状のコードベースでは、ActionLog を読み込む用途はテスト（fixtures/battleSampleScenario* や integration テスト）が中心で、実運用で過去ログを読み出す仕組みは存在しない。  
   - 今後 ActionLog を永続化して再生する機能を検討する場合に備え、以下を決める必要がある。  
     1. ActionLog / BattleSnapshot にバージョン番号（例: `snapshotSchemaVersion`）を付与し、将来の互換性判断を容易にする。  
     2. 旧ログを新フォーマットへ変換する migration スクリプト（tests/fixtures 用）を整備し、差分を自動で適用できるようにする。  
     3. Production での ActionLog 保存を想定する場合、保存形式（JSON/バイナリ）と互換性ポリシー（破壊的変更時の対応）を事前に定めておく。
5. **OperationLog で行動変更を表現する必要性**  
   - OperationLog はプレイヤー操作のみを記録するため、敵行動操作に関するメタ情報を載せる必要はない。

これらを解決しつつ進めることで、Snapshot ベースでの安定描画と通信経路の単純化が実現できます。
