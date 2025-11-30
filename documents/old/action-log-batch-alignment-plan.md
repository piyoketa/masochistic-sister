# ActionLog / AnimationBatch 整合計画（play-card・enemy-act 再編）

## ゴール
- OperationRunner が吐き出す `animationBatches` を、fixtures（`tests/fixtures/battleSample*.ts`）で定義済みの構造と完全一致させる。
- `BattleView` / `useHandStageEvents` から見たバッチ単位の snapshot・待機時間・stage 順序を、turn 単位で決定論的に再現できるようにする。
- `scripts/updateActionLogFixtures.mjs` や integration テストが最新設計（`player-action` / `enemy-action` / `remember-enemy-attack` バッチ）を前提に動作する状態まで揃える。

## 現状ギャップの整理
1. **start-player-turn**: 実装は `turn-start`・`deck-draw` を別バッチで出力し、`mana` 情報を欠落。期待値は 1 バッチ内で turn-start → mana → deck-draw を順序付け、`waitMs = 600ms + (drawn-1)*100ms` を持たせる。
2. **play-card**: 現状は stage ごとにバッチ分割（`mana:*`, `card-trash:*`, `audio:*`, ...）。期待値は `player-action` バッチ 1 個に mana → カード移動 → draw → audio → effect を収め、撃破があれば `enemy-defeat` バッチを追加。
3. **enemy-act**: 実装は `enemy-highlight` / `player-damage` / `create-state-card` / `memory-card` をそれぞれ別バッチにしており、snapshot 更新も stage 毎に発生。期待値は `enemy-act-start` → `enemy-action`（player-damage + create-state-card + audio）→ `remember-enemy-attack`（memory-card）の 3 バッチ構成。
4. **snapshot / hand 反映タイミング**: `cardAdditionIds` を `cardsAddedToPlayerHand` のみから算出していたため、`memory-card` の snapshot 前倒しが発生していた。State/memory イベント全般で snapshot 反映タイミングを揃える必要がある。
5. **fixtures 生成スクリプト**: `normalizeAnimationStructure` が `player-action` バッチを疑似的に構築しているが、実装が追従していないため `npm run test:unit` で大量不一致が発生。

## タスク詳細
1. **OperationRunner のバッチ再編**
   - `start-player-turn` で turn-start/mana/deck-draw を単一バッチ化（wait 計算含む）。
   - `buildPlayCardAnimations` を `player-action` / `enemy-defeat` の 2 バッチ構成へ再実装し、instruction 順序（mana → card-move → draw → audio → damage）を固定。撃破が無い場合は `enemy-defeat` を生成しない。
   - `attachEnemyActAnimations` を `enemy-act-start` / `enemy-action` / `remember-enemy-attack` の 3 バッチに統一。`enemy-action` バッチ内で player-damage → create-state-card → audio を並べ、`remember` バッチに memory-card のみを入れる。
   - snapshotBeforeCardAdditions の消滅対象を state/memory イベントの cardIds まで拡張し、`memory-card` のアニメ再生前に手札へカードが現れないようにする。
2. **Battle / Player イベント配線**
   - `Player.rememberEnemyAttack` → `Battle.recordMemoryCardAnimation` の流れで enemyId/Card 情報を漏れなく渡し、OperationRunner が `remember-enemy-attack` バッチに必要な metadata を取得できるようにする。
   - 疼き (`ScarRegenerationAction`) のようなプレイヤー起点 `memory-card` を `player-action` バッチへ残しつつ、敵由来の memory-card は `remember-enemy-attack` バッチに限定する分岐を OperationRunner へ追加。
3. **Fixture / Script / テスト更新**
   - `scripts/updateActionLogFixtures.mjs` から `combinePlayCardBatches` 等の補正ロジックを大幅削減し、実装側が吐き出したバッチ構成をそのまま書き出す形へ切り替える。
   - `tests/integration/battleSample*.spec.ts` の比較ヘルパを最新構造（`player-action`・`enemy-action` 等）の前提に刷新する。`operationRunnerInstructions.spec.ts` など unit も stage 名変更（`enemy-damage` など）に追従。
   - fixtures を再生成し、差分をレビューした上で `npm run test:unit` を安定させる。
4. **検証フロー整備**
   - `LOG_BATTLE_SAMPLE*_SUMMARY=1` で ActionLog を随時ダンプし、stage/batch 列挙が期待通りか確認するスクリプトを用意。
   - `npm run type-check` → `npm run test:unit` の順で CI 互換の検証を行う。

## 不明点・相談事項
| # | 内容 | 選択肢 | 推奨 |
| --- | --- | --- | --- |
| 1 | start-player-turn のマナ表示をどう扱うか | A) 現在マナを `mana` stage で表示 / B) 差分のみ表示 | **A**：fixtures が現状値を使っており、View 側で差分計算する理由が無いため。
| 2 | enemy-action バッチ内での `audio` の位置 | A) player-damage 前 / B) player-damage 後 / C) 任意 | **C**：同バッチ内 instruction は同時に開始し最大 wait を共有するため、固定順序に縛られず metadata で制御する。
| 3 | 疼き以外の `memory-card`（プレイヤー起点）が今後追加された場合の扱い | A) すべて `player-action` 内 / B) 敵由来か否かで分岐 | **B**：カード効果ごとの演出差を維持するため、種別によってバッチを切り替える。

## 実装順の提案
1. OperationRunner の各 attach 系を段階的にリファクタし、`LOG_BATTLE_SAMPLE*_SUMMARY` で出力されるバッチ一覧が fixtures と揃うところまで確認する。
2. Battle / Player のイベント伝播（memory-card の enemyId 付与等）をテストでカバーし、snapshot タイミングのブレを無くす。
3. Fixtures スクリプトと integration テストを刷新した上で `npm run test:unit` を実行し、結果を記録。
4. 最後にドキュメント（`animation_instruction.md` 等）の更新と CI 用チェックリストを整理する。
