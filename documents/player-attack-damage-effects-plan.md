# プレイヤー攻撃時に敵へ DamageEffects を表示する計画（初稿）

## 目的
プレイヤーが敵を攻撃した際にも、敵側に DamageEffects の数字演出を表示し、被ダメージが視覚的に分かるようにする。既存の敵攻撃→プレイヤー演出（player-damage）と整合を取り、演出の発火タイミングをアニメーション指示に沿わせる。

## 現状把握
- プレイヤー受傷時: `BattleView` が stage metadata `stage === 'player-damage'` を検知し、`playerDamageOutcomes` を `DamageEffects` へ渡して再生している。
- 敵表示: `EnemyCard.vue` 内に `DamageEffects` が常駐しているが、現在は「敵が攻撃された際の outcomes を流す仕組み」が入っていないように見える（要確認）。
- Stage イベント: `ViewManager` の AnimationScript で `stage-event` が流れてくる設計。敵ダメージ用の stage (`enemy-damage` など) が存在するか要確認。

## 進め方（更新版）
1. **ステージイベント追加（モデル→ビュー）**
   - `AnimationInstruction` に `stage: 'enemy-damage'` を追加し、metadata は `{ enemyId, damageOutcomes }`。enemyId は単一想定（同時複数なし）。
2. **ビュー側伝搬**
   - `BattleView` で `stage-event` を監視し、`stage === 'enemy-damage'` の際に対象 enemyId と outcomes を `BattleEnemyArea` に渡す（既存の player-damage と対称）。
   - `BattleEnemyArea` で受け取り、対象の `EnemyCard` に outcomes を流す props を定義。
3. **EnemyCard 表示**
   - `EnemyCard` 内の `DamageEffects` に outcomes を渡し、受信時に `play()` を呼ぶ。HP バーの更新タイミングはプレイヤーと合わせる（snapshot 適用→演出再生の順序）。
4. **型整備**
   - metadata の型（enemyId: number, damageOutcomes: DamageOutcome[]）を追加し、`battle.ts` などの型定義を更新。
5. **表示位置**
   - DamageEffects は EnemyCard 内に重ねて表示（z-index/スタイルを確認）。
6. **確認**
   - バトル本編でプレイヤー攻撃時に敵カード上にダメージ数字が出ることを確認。デモ追加は任意。

## 不明点・決めたいこと（解消済み）
- 対象敵の識別子: metadata で enemyId を受け取り、単一対象のみ扱う（複数同時なし）。
- 表示位置: EnemyCard 内で問題なし。
- HP バーの更新タイミング: プレイヤー受傷と同様の順序（snapshot 適用→演出再生）で合わせる。

## おすすめ方針
- `AnimationInstruction` に `stage: 'enemy-damage'`（metadata: `{ enemyId, damageOutcomes }`）を追加/確認し、`BattleEnemyArea` 経由で対象の EnemyCard に outcomes を流す。既存の player-damage と対称な実装でシンプルに保つ。
