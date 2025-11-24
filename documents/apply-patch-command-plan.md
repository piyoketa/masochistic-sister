---
title: BattleView.runAnimation の apply-patch 対応計画
updated: 2025-11-16
---

## 目的
- `BattleView.runAnimation` 内の `executeCommand` が `apply-patch` をデフォルト扱いで無視しているため、AnimationScript に含まれる差分パッチがフロントに適用されない問題を解消する。
- `apply-patch` を `update-snapshot` と同等に処理し、演出前に最新スナップショットが反映されるようにする。

## 現状と課題
- `AnimationCommand` の `type: 'apply-patch'` は `ViewManager.applyAnimationCommand` に実装済みだが、`BattleView.executeCommand` で分岐が無いためスキップされる。
- その結果、`stage-event`（例: `deck-draw` / `card-trash`）が patch 適用前の snapshot を前提に動作し、手札差分検知や pending 処理が破綻するリスクがある。

## 対応方針
1. `executeCommand` の `switch` に `case 'apply-patch':` を追加する。
   - `update-snapshot` と同様に `viewManager.applyAnimationCommand(command)` を呼び、`await nextTick()` で DOM 反映と watchers 発火を待つ。
   - コード重複が気になる場合は `update-snapshot` と同じブロックにまとめる（意図をコメントで明示）。
2. 既存の `stage-event` / `wait` / `custom` の順序は維持し、Script 内のコマンド順に従って逐次処理されることを確認する。

## 実装タスク
- [ ] `src/views/BattleView.vue` の `executeCommand` に `apply-patch` 分岐を追加（`update-snapshot` と同じ処理パスで可）。
- [ ] 必要なら簡潔なコメントで「patch 適用→nextTick で描画同期」を明示。
- [ ] （任意）`update-snapshot` 分岐と共通化して冗長性を下げる。

## テスト方針
- [ ] `BattleView.spec.ts` に「apply-patch を含む AnimationScript を再生すると snapshot が更新される」テストを追加。テスト名は日本語。
  - Script: `apply-patch` → `stage-event` → `update-snapshot` 等を含め、`executeCommand` が `apply-patch` を処理することを検証。
  - 期待: `viewManager.state.snapshot` または手札/デッキの差分が反映され、エラーが出ない。
- [ ] 既存テストの影響確認（スナップショット依存のものがあれば更新）。

## 不明点・要確認事項
- `apply-patch` 処理後に `nextTick` を入れるのが適切か（`update-snapshot` と揃える案を推奨）。 -> `update-snapshot` と揃える
- `apply-patch` と `update-snapshot` を同一分岐にまとめるか、個別に書くかのスタイル。推奨は共通処理で明確化。 -> 共通処理で明確化

## 推奨選択肢
- `nextTick` を挟む（推奨）: 手札差分ウォッチャ等の描画依存処理が安定する。
- `update-snapshot` と同ブロックで処理（推奨）: 今後のコマンド追加時に挙動差分を生みにくい。
