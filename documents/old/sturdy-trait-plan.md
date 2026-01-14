# SnailTeam 一体に「頑丈」付与（最大HP+10）計画

## ゴール
- SnailTeam の OrcEnemy / OrcDancerEnemy / TentacleEnemy のいずれか1体にランダムで Trait「頑丈」を付与し、最大HPを初期値から +10 する。
- 「頑丈」付与対象は戦闘開始時に決定され、同じ戦闘内で変わらないこと。

## 現状確認
- SnailTeam は `OrcEnemy` `OrcDancerEnemy` `TentacleEnemy` `SnailEnemy` をメンバーに持つ。
- Trait「頑丈」に相当する State/Trait が未確認。必要なら新規 TraitState を実装するか、既存の類似 Trait があるか調査が必要。
- 最大HP増加は Enemy インスタンス生成時に `maxHp` と `currentHp` を直接上書きするのが確実。

## 対応方針（推奨）
1. **Trait定義を確認/用意**  
   - 既存に「頑丈」相当の TraitState があればそれを再利用。なければ新規で `SturdyTrait`（id: `trait-sturdy`）を実装し、説明は「最大HP+10」程度にする。
2. **SnailTeam でランダム選択**  
   - SnailTeam のコンストラクタで OrcEnemy / OrcDancerEnemy / TentacleEnemy を配列にしてランダムに1体選ぶ。
   - 選ばれた Enemy に `addState(new SturdyTrait())` を実行し、併せて `maxHp` と `currentHp` を +10 する（最大HP更新→現在HPも同値に揃える）。
3. **再現性**  
   - 乱数は既存サンプル同様 `Math.random()` で十分（テスト固定は不要）。
4. **表示/ラベル**  
   - Trait 名と説明が敵状態一覧に反映されるようにし、説明に「最大HP+10」を明記する。

## 実装ステップ案
1. Trait の有無確認。なければ `SturdyTrait` を `states` に追加実装（TraitState で isImportant: false）。
2. SnailTeam コンストラクタで対象候補をリスト化し、`Math.floor(Math.random() * 3)` などで1体選択。  
   - 選択対象の `maxHp` を `+10`、`currentHp` も `+10` で補正。  
   - `addState(new SturdyTrait())` を呼び、State にも効果説明を入れる。
3. 手動確認：SnailTeam と戦闘開始時に誰か1体が「頑丈」表示＋HP増加になっていることを確認。
