---
title: Deck Draw アニメーション調査計画
date: 2025-11-15
---

## 目的
`deck-draw` ステージのアニメーションが BattleHandArea 上で再生されず、デフォルトの `enter` トランジションのみが走っている原因を特定し、修正方針を決める。

## 現状認識
- ActionLog / AnimationBatch では `stage: 'deck-draw'` が生成され、`waitMs` や `cardIds` が付与されている。
- `useHandStageEvents` で `deck-draw` を受信した際に `pendingDrawCardIds` へ積んでいるが、最終的な DOM 側では `hand-card-wrapper--hidden` が解除されるだけで、`startDeckDrawAnimation` の処理が描画されていない。
- `useHandAnimations.startDeckDrawAnimation` はカード DOM 要素とデッキカウンタの両方が揃わないと早期リターンするため、初期化順序の問題の可能性がある。
- 実機で確認すると、`TransitionGroup` の enter アニメーションだけが適用されており、FloatingCard（deck→手札）も表示されていない。

## 調査タスク
1. **イベント受信〜DOM参照のタイミング確認**
   - `useHandStageEvents.processNewHandCards` が snapshot 更新後すぐに `startDeckDrawAnimation` を呼んでいるかトレース。
   - `handEntries` の更新が `registerCardElement` よりも遅れている場合、DOM 未登録で `startDeckDrawAnimation` が失敗している可能性があるので、ログを挿入してシーケンスを把握する。

2. **DOM 取得失敗時のリトライ挙動を確認**
   - `useHandAnimations.startDeckDrawAnimation` はカード要素または deckCounter が欠けている場合に `console.error` を吐いて終了している。ここで再試行ロジックが無いため、初回 snapshot では deckCounterRef 取得前に呼び出されている可能性がある。
   - deckCounterRef の `ref` がセットされるタイミングを `BattleHandArea.vue` で追い、必要なら `startDeckDrawAnimation` 内に再試行 (setTimeout) を追加する案を検討。

3. **CSS / DOM クラスの競合チェック**
   - `hand-card-wrapper--hidden` や `TransitionGroup` の `enter-active` と競合していないか、実機 DOM を DevTools で確認する。
   - FloatingCard の `div.hand-floating-card--draw` が生成されているのに見えない場合は CSS の z-index や opacity 設定を見直す。

4. **テスト観点の更新**
   - 既存の `HandStageAnimations.spec.ts` は DOM クラスの存在のみチェックしている。deck-draw についても `hand-floating-card--draw` が生成されるかどうかを検証項目に追加予定。
   - テスト拡充は修正方針が固まった後に実施。

## 不明点／確認事項
| 項目 | 選択肢 | 推奨 |
| --- | --- | --- |
| `startDeckDrawAnimation` のリトライ | A) 現行どおり失敗時即終了 / B) DOM 確保まで一定回数リトライ | **B**: deckCounterRef がマウント直後に未設定なケースを吸収できるため |
| `pendingDrawCardIds` の適用タイミング | A) snapshot 更新後に一括処理 / B) stage受信時に遅延処理を登録 | **A** だが、snapshot 更新が stage より先に発生したケースへのフォールバックが必要 |
| FloatingCard の描画位置 | A) deckCounter → 手札 / B) デッキアイコン固定位置 → 手札 | **A** (現状仕様のまま)。deckCounter 未取得なら B にフォールバックする案も検討 |

## 次のアクション
1. `useHandStageEvents` と `useHandAnimations` に詳細なログ（DEV のみ）を追加し、deck-draw で `startDeckDrawAnimation` が呼ばれているか確認。
2. DOM要素未取得で失敗している場合は、deckCounterRef / cardElement の両方についてリトライを実装。
3. 仕組みが整い次第、`HandStageAnimations.spec.ts` に deck-draw の FloatingCard 生成テストを追加し、回帰防止を図る。
