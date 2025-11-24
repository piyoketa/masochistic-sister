# CutInCue 追加計画

## 目的
- Action に新たな演出指定 `CutInCue` を追加し、カードプレイ時にカットイン画像を再生できるようにする。
- BattleView にカットインオーバーレイ (`CutInOverlay.vue`) を組み込み、アニメーションステージ経由で再生を行う。
- 実例として「被虐のオーラ」使用時に `public/assets/cut_ins/MasochisticAuraAction.png` を表示する。

## 実装ステップ案
1. **型・ステージ定義の拡張**
   - `Action/ActionBase.ts` に `CutInCue`（画像パスと待機/再生時間を持つ構造）を追加し、`BaseActionProps` / `ActionContext` のメタデータに含める。
   - `ActionLog.AnimationStageMetadata` に `stage: 'cutin'`（`src`, `durationMs`, `waitMs` など）を追加。
   - `Battle` が保持する `PlayCardAnimationContext` などに cutin 情報を載せられるよう、関連型を拡張。

2. **コンテキスト生成とキュー化**
   - `Action.prepareContext` で `audio` と同様に `cutin` をメタデータへ格納。
   - `Card` 生成時（必要なら）や `Battle.queuePlayCard` 相当の経路で `PlayCardAnimationContext` に cutin を積む。

3. **OperationRunner のアニメーション生成**
   - `OperationRunner.buildPlayCardAnimations` に cutin インストラクション生成処理を追加（audio と同じタイミングで `waitMs` を反映）。
   - `AnimationInstruction` のステージ `cutin` を新設し、`buildCutInInstruction` 的な小関数で組み立てる。
   - 既存 `getAnimationTotalWaitMs` やバッチ生成に影響がないか確認し、必要なら待機時間算入を調整。

4. **BattleView の表示処理**
   - 画面中央に `CutInOverlay.vue` を常駐させる（`BattleView` ルート直下など）。
   - ステージイベントハンドラに `cutin` 分岐を追加し、メタデータの `src` を渡して `play()` を呼ぶ。必要なら `durationMs` を `setTimeout` で合わせる。
   - 既存の audio ステージと競合しないことを確認（同時再生許容を想定）。

5. **Action への適用例**
   - `MasochisticAuraAction` に `cutInCue` を付与し、画像 `public/assets/cut_ins/MasochisticAuraAction.png` を指定。

6. **テスト/検証**
   - Domain: `OperationRunner` が `cutin` ステージを付与することを確認する単体テストを追加（`play-card` の animationBatches 内に含まれるか）。
   - View: `BattleView` のステージハンドラが `CutInOverlay` を呼ぶことを簡易テスト（コンポーネントスタブ＋イベント送出）で担保。
   - 手動: `/demo/cut-in` と実戦 `/battle/...` で Masochistic Aura 使用時に画像が出ることを目視確認。

7. **ドキュメント更新**
   - `documents/animation_instruction.md` に `cutin` ステージを追記し、使用例と待機時間の扱いを明文化。

## 不明点・要確認事項
1. **ステージメタデータの形**
   - 選択肢: `stage: 'cutin', src: string, durationMs?: number, waitMs?: number` 形式にする / audio と同様に `waitMs` は Instruction 側の `waitMs` へ出す。
   - 推奨: audio と同様に Instruction の `waitMs` で待機を表現し、メタデータは `src` と `durationMs` のみにする（実装負担が低い）。
   -> audio と同様に `waitMs` は Instruction 側の `waitMs` へ出す。
2. **表示時間と待機時間の扱い**
   - 選択肢: audio と同じ `waitMs` を使う（Action 側で指定）/ 固定値で 0.2s 入り・0.4s 表示・0.2s 終了をハードコード。
   - 推奨: Action 側から `waitMs/durationMs` を指定可能にし、未指定時は現行カットインコンポーネントの 0.8s（0.2+0.4+0.2）をデフォルトとする。
   -> コンポーネント側は、固定値で 0.2s 入り・0.4s 表示・0.2s 終了をハードコード。AnimationInstructionのwaitMsは、固定値で0.6s（終了アニメーション開始まで）をする。
3. **敵行動への適用可否**
   - 選択肢: 今回はプレイヤー `play-card` のみ / 将来的に `enemy-act` にも許容。
   - 推奨: まずプレイヤーの `play-card` のみで実装し、必要になったら `EnemyTurnActionSummary` へ拡張。
   -> 推奨に従う
4. **プリロード戦略**
   - 選択肢: `CutInOverlay` 内の簡易プリロードに任せる / 事前に `BattleView` でまとめてプリロード。
   - 推奨: ひとまず既存の `CutInOverlay` のプリロード（play 前に decode）を利用し、必要なら Action 定義でファイル名一覧を公開して BattleView 側でプリロード対応を検討。
   -> 事前に `BattleView` でまとめてプリロードする。

この計画で進めて問題ないかご確認ください。批准後、実装に着手します。
