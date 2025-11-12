# card-create Materialize 適用計画

## 現状整理
- CardAnimationLabView の enter アニメは `enterAnimationMode` で `spawn/reveal/flip/spark` を切り替え、`<Transition :name="\`enter-${mode}\`">` で適用している。
- 実際のカード生成（例: BattleHandArea での card-create 演出）はまだ既存の円形ワイプ（`card-wipe`）のみで、Materialize パターンはラボ専用の CSS に留まっている。
- Materialize のキーポイント: opacity/scale/blur のトリプルトランジション + 擬似要素での halo アニメーション（`@keyframes halo`）。

## 目的
- 本番の card-create 演出（手札生成アニメ）を、ラボで実装した Materialize（spawn）パターンに切り替え、統一感のある生成表現にする。

## 実装ステップ（更新版）
1. **カード生成フローの再設計**
   - BattleHandArea に「カード生成エリア」コンテナ（画面中央手前の overlay）を追加し、手札に加える前のカードを一時的にそこへレンダリング。
   - 生成エリアには専用の `<Transition name="materialize-spawn">` を適用し、CardAnimationLabView で検証した Materialize パターンを流用。

2. **ActionCard 生成の流れ変更**
   - `handEntries` に加わる前に、`pendingCreateQueue` などで生成対象カードをキューし、まず生成エリアに表示。
   - アニメーション完了後（Transition の `after-enter`／`@after-enter`）に手札配列へ正式に追加し、`TransitionGroup` を使って本来の位置へ移動させる。

3. **生成エリア → 手札への遷移**
   - 生成エリアのカードに `absolute` 位置と transform を付与し、手札内の差し込み先 DOMRect を取得した上で CSS Transition (translate) で移動。
   - もしくは Vue トランジションの `move-class` を活用して `TransitionGroup` に任せる。どちらでも “生成エリア → 手札位置” のワンクッションを表現。

4. **CSS/Transition 調整**
   - Materialize 用スタイルを `hand-card-create` にまとめ、`prefers-reduced-motion` の際は 200ms 程度に短縮。
   - 生成エリアの背景や z-index を調整し、本来の手札 UI と視覚的に区別する（半透明の円環など）。

5. **ステート管理**
   - 生成中カード（生成エリア表示中）と手札本体を明確に分けるため、`reactive` な `pendingCreateCards` 配列を用意。
   - 生成完了後に `pendingCreateCards` から `handEntries` へ移すことで、`TransitionGroup` の enter と移動アニメが正しく働く。

6. **検証**
   - `/battle` でカード生成時に、中央で Materialize → 手札に移動する流れが自然か確認。
   - 生成エリアが多重に出るケース（複数枚同時生成）でも破綻しないか、prefers-reduced-motion の動作もあわせてテスト。

## 留意点
- card-eliminate や他のアニメには影響しないよう `hand-card-leave-*` には触れない。
- `ActionCard` コンポーネント自体は共通で使うため、ラボ専用の CSS を本番へ移植する際はスコープや z-index を再確認する。
