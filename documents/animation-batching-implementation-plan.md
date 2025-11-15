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
