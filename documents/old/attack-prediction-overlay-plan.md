# 敵攻撃予測オーバーレイでのダメージ反映 対応計画

## ゴール
- 敵の攻撃予測（hoverで表示されるActionCardのオーバーレイ）に、現在のダメージ量・攻撃回数の修正（バフ/デバフ/状態異常など）が反映されるようにする。
- `EnemyActionHint` に `cardId: CardId` を付与し、元アクションの識別子から Blueprint → CardInfo を安定して生成できるようにする。

## 現状整理（推定）
- 予測オーバーレイは「敵行動キューの定義」ベースでカード情報を生成しており、`EnemyActionHint.pattern` をそのまま表示しているため、`calculatedPattern`（状態補正後）を使い切れていない可能性が高い。
- CardInfo 生成がバトルコンテキストと接続されておらず、`overrideAmount / overrideCount` 相当の適用が抜け落ちていると考えられる。

## 対応方針（推奨）
1. **ActionID→CardId で Blueprint を構成**  
   - `EnemyActionHint` に `cardId: CardId` を追加し、敵行動キューからヒントを組み立てる際に元 Attack/Action の ID を kebab-case CardId で付与する。
   - `calculatedPattern.amount/count/type` を `overrideAmount/overrideCount` として Blueprint に反映する。
2. **Library で CardInfo 化**  
   - `buildCardInfoFromBlueprint`（または専用ヘルパー）で CardInfo を生成し、formatEnemyActionLabel と同じ値を表示できるようにする。
3. **hover ごとに最新計算**  
   - 予測値は hover 時に Blueprint 生成→ CardInfo 化して最新の `calculatedPattern` を反映する。

## 不明点と選択肢
1. **どのバフ・デバフを適用するか**  
   - 選択肢A: `calculatedPattern` を唯一の真値として採用（推奨）。  
   - 選択肢B: Battle 状態から再計算して `calculatedPattern` を更新する（後続拡張）。  
   - **推奨**: A。まずは `calculatedPattern` に集約。
2. **表示ビルダーの変更範囲**  
   - 選択肢A: `buildCardInfoFromBlueprint` へ `overrideAmount/count` を流し込み、既存 CardInfo パスを利用（推奨）。  
   - 選択肢B: 予測専用ビルダーを作る。  
   - **推奨**: A。calculatedPattern → Blueprint → Library → CardInfo の一本道にする。
3. **再計算トリガー**  
   - hover時に毎回計算すれば「最新状態」に近づくが、パフォーマンスが許容されるか確認が必要。
   - **推奨**: hover時に再計算。問題が出ればキャッシュを検討。

## 実装ステップ案
1. 予測オーバーレイを生成している箇所を特定し、`EnemyActionHint` を受け取るパスを確認。  
2. `EnemyActionHint` 型に `cardId: CardId`（オプショナル可）を追加し、敵行動キューからヒントを組み立てるロジックで元アクションの CardId を埋める。  
3. `calculatedPattern` を `overrideAmount/count/type` として Blueprint を組み立てるヘルパーを作成し、`buildCardInfoFromBlueprint` で CardInfo 化。  
4. hover 時にこのパスを呼ぶよう差し替え、`calculatedPattern` で打点/回数が変化しているケースで表示が一致することを手動確認。
