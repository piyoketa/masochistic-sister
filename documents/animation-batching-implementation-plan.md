# Animation Batch 実装タスクリスト（再整理）

## 目的
- `AnimationBatch` 構造へ完全移行し、`OperationRunner` から `BattleView` までをバッチ再生仕様にそろえる。

## 作業ステップ
1. **OperationRunner 全体のバッチ化**
   - `attachSimpleEntryAnimation` を含めたすべての entry 生成ルートで `QueuedAnimationInstruction` → `groupQueuedInstructions` を使う。
   - `create-state-card` / `memory-card` / `audio` stage を仕様通り発行し、固定 wait を付与。
   - `Mana`/`card-trash` などの固定時間ステージを定数化。
2. **ViewManager / BattleView / StageEvent**
   - `StageEventPayload` をバッチ単位で受け取れるよう変更。`latestStageEvent` もバッチ ID 基準に。
   - `useHandStageEvents` / `useHandAnimations` を新 stage (`create-state-card`, `memory-card`, `audio`) に対応させ、カード追加演出を振り分ける。
   - 音声再生のスケルトン（`DamageEffects` の仕組みを流用予定）を stage-event でトリガできるようにする。
3. **Fixture / テスト更新**
   - `tests/fixtures/battleSample*.ts` を `AnimationBatch` フォーマットへ変換。
   - `tests/integration/utils/battleLogTestUtils.ts` や `updateActionLogFixtures.mjs` を新構造に対応（バッチ→インストラクション配列出力）。
   - `tests/domain/battle/operationRunnerInstructions.spec.ts` 等もステージ/バッチ単位で assertions を修正。
4. **TypeScript / ドキュメント**
   - `StageEventPayload`, `AnimationInstruction` 型定義を更新し、各所の import/補完を整える。
   - `animation_instruction.md` などの設計ドキュメントへ最終仕様（バッチ例、stage 一覧、固定 wait 値）を記載する。

## 補足
- 大きな変更のため、ステップごとにテスト & 型チェックを取り回して進行する。
- バッチ構造の導入に伴い `BattleView` 側の再生キュー制御も要調整。`stage-event` に対応する UI コンポーネント（hand, state, audio）の挙動を確認する。

---

# Integration テスト向け AnimationBatch 対応計画

## 目的
- シナリオ系テスト（`tests/integration/battleSample*.spec.ts`）で `AnimationBatch` 単位の構造差分を比較できるようにし、ステージ列だけでなく「どのバッチがどの snapshot を持つか」まで検証範囲に含める。
- ActionLog Fixture のフォーマットを `AnimationBatch` 視点で再定義し、`snapshot` がバッチ単位に変わった点をテスト期待値へ反映する。

## 作業ステップ
1. **サマリ生成器の仕様決定**
   - `tests/integration/utils/battleLogTestUtils.ts` の `summarizeActionLogEntry` を拡張し、`animationBatches` をそのままシリアライズするモードと、従来どおり `instructions` をフラット化するモードを双方提供する。
   - この段階で `AnimationInstructionSummary` を `batchId` + `instructionIndex` で識別できる構造に整理し、`snapshot` にはバッチ snapshot を引用するよう統一。

2. **Fixture 生成スクリプト更新**
   - `scripts/updateActionLogFixtures.mjs` に「batch モード」を追加し、`entry.animationBatches` の raw 構造を JSON→TS へ落とせるようにする。
   - 既存のコメント（手札/HP 等）も `batch.snapshot` から取得するようリファクタする。
   - 生成結果として `animations` プロパティではなく `animationBatches`（`{ batchId, snapshot, instructions: [...] }`）を含む JSON へ置き換え、OperationRunner の実装変更と整合させる。

3. **Fixture ファイル差し替え**
   - `tests/fixtures/battleSampleExpectedActionLog.ts` / `battleSample2ExpectedActionLog.ts` を再生成し、`AnimationBatch` 構造を検証対象へ組み込む。
   - 可読性を保つため、1 バッチ 1 コメント（stage 解説 + snapshot 状態）形式で出力されるようテンプレートを微調整。

4. **Integration テストの比較ロジック刷新**
   - `battleSample*.spec.ts` では `summarizeActionLogEntry` の `animationBatches` 付き結果を取得し、`lastActionIndex` までの `type`, `operations`, `animationBatches` を Deep Equal で評価する。
   - 既存の `omitAnimations` ヘルパや `collectAddedHandCardIds` テストは、フラット化した instructions を使う補助として残しつつ、新しい `compareAnimationBatches` ヘルパを追加し「バッチ数一致 / snapshot プレイヤー値一致 / stage 順序一致」をまとめて検証する。
   - 差分表示をしやすくするため、`expect(...).toMatchInlineSnapshot()` ではなく `toEqual` + カスタムエラーメッセージを採用。

5. **システムテスト観点の追加検証**
   - `OperationLogReplayer` が返す `ActionLog` における `postEntrySnapshot` や `animationBatches` の `snapshot` が同一参照であることを保証するサブテストを追加し、fixture 側の snapshot 期待値と相互に整合を取る。
   - 今後 `remember-enemy-attack-batch` などバッチ名を変更するケースでも、`batchId` の prefix と `stage` 並びを比較するテストを追加し、演出のセット進行を保証する。

## 不明点・相談事項
1. **Fixture 内コメント粒度**  
   - 1 バッチあたりの snapshot をそのまま JSON 化するとファイルサイズが増える。  
   - 選択肢:  
     - A) すべてのカード/敵情報を完全に残す（デバッグ向け）。  
     - B) プレイヤー HP / 手札タイトル / 敵 HP のみ簡略表示。  
   - おすすめ: **A**（トラブルシュート優先、フォーマッタで可読性を担保）。
2. **比較テストの柔軟度**  
   - 演出ペイロードに含まれる `metadata`（例: card title, enemyId）が将来的に拡張される可能性がある。  
   - 選択肢:  
     - A) 完全一致（現行仕様をきっちり固定）。  
     - B) ステージごとに必須項目のみ比較し、余剰キーは許容。  
   - おすすめ: **B** を採用し、比較ヘルパ内で `pickStageKey(stage, metadata)` のように必要キーを抽出して比較する。

## 想定アウトプット
- `tests/fixtures/battleSample*.ts` が `animationBatches` スキーマへ更新されたことを示す差分。
- `battleSample*.spec.ts` で `compareAnimationBatches` を使った新 assertions。
- `scripts/updateActionLogFixtures.mjs` / `battleLogTestUtils.ts` のバッチ対応版。

## 次のアクション
1. `battleLogTestUtils.ts` に `summarizeEntryWithBatches` と `normalizeAnimationBatch` を追加。
2. フィクスチャ生成スクリプトを batch-aware に書き換え、サンプルログを再出力。
3. Integration テストを新フォーマットへ移行し、`expect` の比較粒度を調整。
