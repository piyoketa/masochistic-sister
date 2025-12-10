# オークトレーナー実装計画

## 要求サマリー
- 新敵「オークトレーナー」を追加する。HP40。行動: FlurryAction 15×2、シェイプアップ(単体5ダメージ + 軽量化付与)。初期状態: 軽量化。`allyBuffWeights: { tailwind: 100 }`。
- 軽量化は重量化同様「累積しない」扱いにする。

## 実装タスク案
1) 軽量化の非スタック化  
   - `LightweightState` に非累積の挙動を入れる（例: `stackWith` で既存スタックを維持、記述を「(累積しない)」表記に変更）。必要に応じて `HeavyweightState` も同等の非スタック防御を追加して仕様を揃える。  
   - 影響範囲: 状態付与ロジック全体（攻撃やデバフで軽量化/重量化を連続付与されたときの挙動）。
2) シェイプアップアクション追加  
   - `ShapeUpAction` (仮名) を新規作成。`Attack` を継承し、基礎ダメージ5 (type: `single`, cardId例: `shape-up`)、命中時に対象へ `LightweightState` を付与。  
   - エフェクト種別やカードタグは既存の単体攻撃 (`FattenAction`) に準拠させる。  
   - 上部コメントで責務・非責務・主要インターフェースを明記。
3) オークトレーナーの定義  
   - `OrcTrainerEnemy` を `OrcSumoEnemy` に倣って追加。`FlurryAction` を `cloneWithDamages` で 15×2 (`type: 'multi'`) に調整し、`ShapeUpAction` と2枚構成。  
   - 初期状態に `LightweightState` を1つ持たせ、`allyBuffWeights` は `{ tailwind: 100 }`。画像パスは指定がなければ既存オーク画像を暫定使用。  
   - 新規ファイルの先頭に責務コメントを入れる。
4) エクスポートと編成導線  
   - `src/domain/entities/enemies/index.ts` へエクスポートを追加。  
   - どの敵チームに登場させるか未定の場合は保留にし、決まっているなら既存チーム（例: `OrcSumoSquad` 差し替え/追加）へ組み込み。  
5) テスト・確認  
   - 最低限: 軽量化が非スタックであることを確認するユニットテスト（`stackWith` で強制的に増えないこと）。  
   - 可能なら `ShapeUpAction` がダメージ5と軽量化付与を同時に行うこと、`OrcTrainerEnemy` の初期状態/行動セットが期待通りであることを検証するテストを追加。  
   - 既存スナップショット更新が必要なら `scripts/updateActionLogFixtures.mjs` を利用。

## 不明点・要判断
- シェイプアップの演出タイプ/カードタグ: `effectType` をどうするか（案: `impact` で `FattenAction` と揃える／`slash` で素早い斬撃感を出す）。推奨: `impact` で既存仕様と揃える。  
- cardId: 新規 `shape-up` で問題ないか。推奨: `shape-up`。  
- 画像パス: 既存 `/assets/enemies/orc.jpg` を流用でよいか、新規画像指定が必要か。推奨: 指定がなければ暫定で流用。  
- 出現チーム: どのチームに組み込むか（新規チーム追加、`OrcSumoSquad` 差し替え、単体テスト用のみなど）。推奨: 既存チームに追加する場合は `OrcSumoSquad` に1体差し替え or 新チームを作成。  
- 重量化の非スタック化: 仕様上「同様」とのことだが、`HeavyweightState` も明示的に非累積へ変更してよいか。推奨: 両方で非スタックをコード上保証し、説明文も揃える。  
- 軽量化の説明文: 非スタック化に合わせて「2/3倍・+1回（累積しない）」に単純化してよいか。推奨: 非累積を明記し、表現も固定値に寄せる。
