## 目的
- AllyStateSkill 系の新スキル「治療（仮）」を追加し、味方に付与された特定の状態異常（腐食 / 関節損傷 / 粘液）をランダムに1種除去する。
- 対象となる状態異常を保持する味方がいない場合は、`canUse` が false になり `planTarget` も失敗する仕様を満たす。

## 現状の関連実装
- `AllyStateSkill` / `AllyBuffSkill` が味方ターゲットの事前決定 (`planTarget`) と付与処理の土台を提供している。現状は「付与」前提で除去ロジックは存在しない。
- 状態 ID:
  - 腐食: `state-corrosion` (`CorrosionState`)
  - 関節損傷: `state-joint-damage` (`JointDamageState`)
  - 粘液: `state-sticky` (`StickyState`)
- `EnemyTeam` に味方（enemy-same-side）を列挙する仕組みがあり、`AllyStateSkill.planTarget` は `requiredTags` + weight で抽選する。

## 要件整理
1. スキル効果
   - 対象: 腐食 / 関節損傷 / 粘液のいずれかを保持する味方1体（自分以外 or 自分含むか？ → **提案: 自身も含めて可**）
   - 処理: 対象が持つ上記ステートのうち、存在するものを列挙し、1種類をランダム抽選して完全削除（スタック数に関わらず removeState）。
2. 使用可否
   - 味方チーム内に上記ステートを保持するユニットが1体もいない場合は `canUse` false。
   - `planTarget` も false を返し、ターゲットなしで行動しない。
3. 既存挙動への影響
   - 新スキルとして追加し、他の AllyBuffSkill に影響を与えない。
   - 重み付け抽選は既存の `requiredTags` / `affinityKey` の仕組みを利用する。

## 実装方針
1. **スキルクラスの追加**
   - 新規アクション例: `AllyCleanseSkill` (仮) を `src/domain/entities/Action/` 配下に追加。
   - `AllyStateSkill` を継承し、`inflictStates` は不要。
2. **canUse 判定**
   - `canUse` をオーバーライドし、味方チーム（EnemyTeam.members）に対象ステートを少なくとも1種持つユニットがいるかをチェック。
   - なければ false。
3. **planTarget 拡張**
   - デフォルトの `planTarget` を流用しつつ、抽選候補を「対象ステートを持つ味方」にフィルタする。
   - どのステートを持つかの有無チェックをヘルパー化。
4. **perform での除去処理**
   - `resolveAllyTarget`（基底のターゲット復元/取得ロジック）を使い、ターゲットが不在なら skipped メタデータをセット。
   - ターゲットが持つ対象ステートを収集し、ランダムに1種選択（source.sampleRng() で決定）。
   - 選択したステートを `removeState(stateId)` などで削除。ログ/メタデータへ `{ removedStateId, removedStateName }` を記録。
5. **ターゲットステート判定の共通化**
   - 対象ステートIDのリスト `CLEANSABLE_STATE_IDS = ['state-corrosion', 'state-joint-damage', 'state-sticky']` をクラス内定数として管理。
   - 抽選時は、ターゲットが持つステートのうち ID が一致するものだけを候補にする。
6. **テスト追加**
   - canUse/planTarget: 味方に対象ステートがない場合 false になること。
   - perform: スタック値にかかわらず1種をランダム除去すること（`sampleRng` をモックして決定的に）。
   - perform: 対象が複数ステートを持つとき、ランダム選択されることを確認する（rng 固定）。
   - perform: 対象不在で skipped になること。

## 不明点・選択肢（提案）
- **自分自身を対象に含めるか？**  
  - 選択肢: (A) 自身も含む（デフォルト）。(B) 自身を除外。  
  - **おすすめ: A**（タグ抽選の仕組みを変えずに済む）
- **ターゲットの `requiredTags` / `affinityKey`**  
  - 既存 AllyStateSkill の仕組みをそのまま使う。重みを調整したい場合のみスキル側で設定。
- **ログ/演出**  
  - 行動メタデータに `removedStateId` を残すかは任意。**おすすめ: 残す**（デバッグ・演出で利用可能）。

この計画で問題なければ実装に着手します。
