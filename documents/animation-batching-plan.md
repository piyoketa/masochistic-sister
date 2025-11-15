# アニメーション再設計計画（バッチ導入）

## 目的
- `BattleActionLogEntry` / `AnimationInstruction` にバッチ概念を導入し、1バッチ内で複数ステージのアニメーションを同期的に再生できるようにする。
- stage `card-create` を `create-state-card` / `memory-card` に分割し、それぞれ描画時間・発生タイミングを明確化する。
- 音声再生ステージを追加し、`play-card` / `enemy-act` と連動した効果音を再生できる拡張点を用意する。

## タスク分解
1. **バッチ概念の追加 (Domain / Types)**
   - `AnimationInstruction` に `batchId` を必須化し、`waitMs` の解釈を「同バッチ内で最大の `waitMs` が経過したら次バッチへ進む」ルールに更新。
   - `BattleActionLogEntry.animations` を `AnimationBatch[]`（`{ id: string; snapshot: BattleSnapshot; instructions: AnimationInstruction[] }`）へ置き換え、構造を明確化。過去シナリオテスト（fixtures）もこの形式に更新する。
   - `OperationRunner` とドキュメント (`animation_instruction.md`) を更新。

2. **create-state-card / memory-card の分離実装**
   - `Player.addState` / `Player.rememberEnemyAttack` でそれぞれ異なるアニメーション event を積む。
   - `OperationRunner` の `buildEnemyActionAnimations` / `buildPlayCardAnimations` 内で新 stage を発行。  
     - `create-state-card`: `waitMs = 500ms` 固定、敵行動バッチ (`enemy-action-batch`) に入れる。
     - `memory-card`: `waitMs = 1500ms` 固定、敵行動バッチ後に `remember-enemy-attack-batch` を追加して再生。
   - 既存の card-create ロジック (`useHandStageEvents` / `useHandAnimations`) を stage 名で振り分け、state-cardはシンプル演出、memory-cardは既存 Materialize を流用。

3. **音声ステージの追加**
   - Action 定義に任意 `soundId` を持たせ、`OperationRunner` が `stage: 'audio'` を生成（`waitMs = 500ms`）。デフォルトでは soundId を持たないため、stage は生成されない。
   - `play-card` バッチで mana / card-trash / audio をまとめ、`enemy-act` 側でも必要に応じて音声 stage を差し込む余地を残す（フロントの音声コンポーネントはスケルトンで可）。

4. **フロント実装更新**
   - `BattleView` のアニメーション再生ロジックを「バッチ単位で再生」できるようリファクタ。  
     - 同バッチ内の instruction は並列再生。
     - 最大 `waitMs` を計測し、完了後に次バッチへ。
   - `useHandStageEvents` / `useHandAnimations` を `create-state-card` / `memory-card` / `audio` に対応させ、再生時間を調整。
   - 効果音コンポーネント (丹ロジック) のスケルトンを配置し、`stage: 'audio'` 受信時にトリガする仕組みを構築。

5. **テスト / ドキュメント**
   - `tests/domain/battle/operationRunnerInstructions.spec.ts` などで新しいステージ/バッチが期待通りに出力されるか確認。
   - `tests/components/BattleHandArea.spec.ts` や演出テストも stage 名変更へ追随。
   - `documents/animation_instruction.md` を更新し、enemy-act / play-card のバッチ構成と待ち時間を明記。

## 不明点・確認事項
1. **バッチ構造のデータ形式**  
   - `animations: AnimationInstruction[]` を保ちつつ `batchId` をキーに扱うか、`BattleActionLogEntry` 側を `AnimationBatch[]` に変えるか。  
   - **選択肢**:  
     - (A) `AnimationInstruction` に `batchId` を追加し、View でグルーピング（後方互換性重視）。  
     - (B) 新たに `AnimationBatch` 型を Entry に持たせ、`instructions` 配列をネスト（構造明確）。  
   - **推奨**: (B) 明確に配列で管理したほうがバッチ単位の進行制御が実装しやすい。ただし既存データの migrate が必要。

2. **`memory-card` のバッチ配置**
   - 各 `enemy-act` の `enemy-action-batch` に続けて `remember-enemy-attack-batch` を生成。敵アクションが攻撃ではない場合は `remember` バッチを生成しない。

3. **Front 側既存アニメーションとの整合**
   - バッチ単位で snapshot/StageEvent を扱えるよう、`BattleView` / StageEvent queue の処理を調整。現状で特別な意思決定は不要（この方針で問題なし）。

## 次のステップ
1. バッチ構造のデータモデル決定（不明点1 = AnimationBatch 形式）→ 決定済み(B)。
2. OperationRunner で `create-state-card` / `memory-card` / `audio` ステージを出力するよう改修。
3. Front の StageEvent 処理をバッチ対応へリファクタ。
4. サウンド再生コンポーネントのスケルトン実装。
5. 既存シナリオテスト／fixtures を新フォーマットに更新し、ドキュメント (`animation_instruction.md` など) を刷新。

不明点1〜3 についてご判断いただければ、設計を確定させて実装に着手します。***
