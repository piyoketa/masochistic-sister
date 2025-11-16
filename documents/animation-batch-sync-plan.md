# AnimationBatch 実装 追従計画（fixture 完全整合版）

## ゴール
- `tests/fixtures/battleSample*.ts` に手で反映された仕様（`create-state-card` / `memory-card` / `audio` のタイミング、`enemy-defeat` バッチ分割 等）と **実コード** の挙動を完全に一致させる。
- `OperationRunner` → `BattleView` → テストのパイプラインを通して「Enemy アクションのログ → バッチ → 演出」の順序が保証される状態を作る。

## 作業ステップ

### 1. OperationRunner のステージ発行を仕様に合わせる
1. `Battle.recordStateCardAnimation` / `recordMemoryCardAnimation` の記録タイミングを見直し、**敵行動中に Player へ付与される状態だけ**が `create-state-card` を発火するようにする。  
   - 現状 `end-player-turn` でまとめて処理しているステートもあるため、`Battle.applyEnemyAction` 内で付与直後にイベントを enqueue する形へ移行する。
2. `OperationRunner.attachEnemyActAnimations`（仮称）を整理し、`enemy-action` バッチに「`player-damage` → `create-state-card`（任意）→ `audio`（任意）」が並ぶようにする。  
   - State を付与しない攻撃（例: たいあたり）では `create-state-card` を発行しない。
3. `remember-enemy-attack` バッチを `memory-card` イベント発生直後に生成する。  
   - `ScarRegenerationAction`（疼き）による `memory-card` だけは例外的にプレイヤーアクション側のバッチへ入れる。
4. `SkipTurnAction` など `action.type === 'skip'` の敵行動には `audio` ステージ（`skills/OtoLogic_Electric-Shock02-Short.mp3`）のみを積む特別パスを追加する。

### 2. Battle / Player 系イベントの接続を再調整
1. `Player.addState` / `BattleStateStack` で発火するイベントを `OperationRunner` が確実に consume できるよう、イベントキューの flush タイミングを `OperationRunner` 側に一本化する。  
2. `Player.rememberEnemyAttack` から `memory-card` を追加する際、対象の敵 ID とカード情報を合わせて記録し、`remember-enemy-attack` バッチで参照できるようにする。  
3. 疼き（ScarRegenerationAction）での `memory-card` は `player-action` バッチ内に入れるロジックを実装し、他の `memory-card` とは別経路で処理する。

### 3. ViewManager / StageEventPayload の最終同期
1. `StageEventPayload` の union に `already-acted-enemy` / `audio` を追加し、`BattleView` 側で `skills/OtoLogic_Electric-Shock02-Short.mp3` のようなサウンドを再生できる経路を完成させる（現状のプレースホルダーログを本実装へ差し替え）。  
2. `useHandStageEvents` と `useHandAnimations` で `create-state-card` / `memory-card` のアニメーション差異を吸収し、Memory カードが手札に追加される描画タイミングをフィクスチャと揃える。

### 4. テスト＆フィクスチャ更新
1. `scripts/updateActionLogFixtures.mjs` のイベント集約ロジックを再確認し、今回仕様で削除された `create-state-card` が再発行されないようにする。  
   - 疼き用 `memory-card` を `player-action` バッチに固定する処理も合わせて調整。
2. `tests/integration/battleSample*.spec.ts` が各ステージの順序と wait 時間を検証するよう、比較ヘルパを更新。  
   - 特に `enemy-action` バッチの `[player-damage → create-state-card? → audio?]` 順序と `remember-enemy-attack` の存在を assertion する。
3. `OperationRunner` の単体テスト (`operationRunnerInstructions.spec.ts` 等) にも「状態付与しない敵行動では create-stage-card が出ない」「skip アクションは audio のみ」などのケースを追加する。

## 不明点・相談事項
| # | 内容 | 選択肢 | 推奨 |
| --- | --- | --- | --- |
| 1 | 疼き以外でプレイヤー側が `memory-card` を生成するケース（今後追加予定）が `player-action` バッチ内に収まるか？ | A) すべて `player-action` 内 / B) 追加カード種に応じて別バッチ化 | **B**（カードごとの演出差を柔軟に出すため別バッチ化を許容） |
| 2 | `audio` ステージの待ち時間を固定 500ms にするか、将来的に `OperationRunner` から可変 wait を渡すか | A) 500ms固定 / B) metadata で可変 | **B**（サウンド定義側で duration / wait を持たせる） |

## 次ステップ
1. OperationRunner の `enemy-action` バッチ生成をリファクタし、`create-state-card` / `memory-card` のタイミングをフィクスチャ通りに合わせる。
2. 疼き用 `memory-card` 挿入と SkipTurnAction 用 `audio` 生成を Route 別に実装。
3. スクリプト & テストを更新して差分を確認しながら、`npm run type-check` / `npm run test:unit` を通す。
