---
title: BattleSnapshot / Patch 連携再設計計画
date: 2025-11-15
---

## 新ルール
1. `BattleActionLogEntry` は「エントリ適用後」の完全な `BattleSnapshot` を保持する。
   - リプレイ / デバッグでアニメーションをスキップする場合は、この snapshot を直接 ViewState に適用して盤面を再構築する。
2. 各 `AnimationBatch` は、`batchId` とともに「対象 Instructions を再生することで発生する差分」を `BattleSnapshotPatch` として持つ。
   - Patch は `BattleSnapshot` の部分集合プロパティで構成され、存在する項目のみを ViewState に適用する。
   - Patch 適用時に DOM に事前クラスを付与するなど、演出準備用のメタ情報も盛り込める。

## 現状課題
- `BattleSnapshot` は entry 投稿時の状態で固定されており、`deck-draw` バッチには draw 前の snapshot が紐づくケースがある。
- View 側では `BattleHandArea` が `snapshot` の diff を見て即座に DOM を更新するため、「カード移動演出→DOM更新」の順序が崩れ、演出が感じづらい。
- `StageEventPayload` の `snapshot` 依存が曖昧で、`ViewManager` がバッチ単位で DOM を同期する仕組みがない。

## アプローチ
1. **Snapshot Responsibility 再整理**
   - `BattleActionLogEntry.postEntrySnapshot` を「完全な盤面 snapshot」として位置付け、OperationRunner の各処理がエントリ適用後に一度だけ生成する。
   - 既存の `AnimationBatch.snapshot` は廃止し、代わりに `BattleSnapshotPatch` を導入。Patch は `patchId` + `changes`（partial snapshot）で構成。

2. **OperationRunner: Patch の組み立て**
   - カード移動やマナ変化、敵HP変化などに応じて Patch オブジェクトを生成し、バッチへ添付。
   - Patch には DOM 演出用の `preClassAssignments` や `handAnimationHints` などの補助情報も収容可能にする。

3. **ViewManager / BattleView: Patch 適用機構**
   - バッチ再生開始前に Patch を `managerState.snapshot` へ部分適用（差分適用）する `applySnapshotPatch` ユーティリティを実装。
   - `BattleHandArea` など View コンポーネントは Patch 適用後の状態を即参照し、Stage 演出はその結果を補強する役割に専念。

4. **Hand 表示ロジック**
   - `useHandStageEvents` は snapshot 差分ではなく Patch を直接参照し、`pendingDrawCardIds` のような暫定キューを削減。
   - FloatingCard の役割は「Patch 適用で DOM が更新された後に視覚的トランジションを追加する」位置付けに変更。

5. **テスト / fixtures 更新**
   - `scripts/updateActionLogFixtures.mjs` を Patch 形式に対応させ、fixtures へ Patch 情報を持たせる。
   - `battleSample*.spec.ts` では Patch が適切に適用されているかを比較。
   - `HandStageAnimations.spec.ts` に Patch → DOM 更新の検証を追加。

## タスクリスト
1. OperationRunner:
   - [x] `BattleActionLogEntry.postEntrySnapshot` を後状態で確定させ、`AnimationBatch` へ Patch を付与する実装へ変更。
   - [ ] Patch 生成用のユーティリティ（例: `createHandPatch`, `createManaPatch`）を追加。
2. ViewManager / BattleView:
   - [x] Patch を差分適用する `applySnapshotPatch` を実装し、バッチ処理ループに組み込む。
   - [x] StageEvent 発火前に DOM が Patch 適用後の状態に更新されるよう、`managerState.snapshot` 反映と `nextTick` を制御。
3. Hand エリア:
   - [x] `useHandStageEvents` を Patch ベースに書き換え、`pendingDrawCardIds` など不要状態を整理。
   - [ ] カード移動演出は可能な限り DOM transform（CardDrawLab 方式）へ置き換え、FloatingCard 依存を段階的に撤廃。
4. Fixtures / Scripts:
   - [x] `scripts/updateActionLogFixtures.mjs` で Patch を取り扱い、`tests/fixtures/*` を新スキーマに更新。
   - [x] `tests/integration/battleSample*.spec.ts` が Patch 差分を比較するよう修正。
5. ドキュメント:
   - [ ] `documents/animation_instruction.md` に Snapshot/Patch 運用ルールを追記。
   - [ ] `documents/animation-batching-plan.md` など関連資料を Patch 基盤へアップデート。

## 不明点 / 確認事項
| 項目 | 選択肢 | 推奨 | メモ |
| --- | --- | --- | --- |
| Patch 適用位置 | A) ViewManager (バッチ単位) / B) BattleView (Stage 単位) | **A** | ViewManager が一元的に差分を適用し determinism を担保する |
| `preEntrySnapshot` の扱い | A) 必要なら `beforePatchSnapshot` を追加 / B) 不要 | **B** | Entry 後 snapshot のみ保持し、再生スキップ時はその snapshot で DOM を再構築する |
| FloatingCard | A) 維持 / B) DOM transform | **B** | Patch 適用直後に DOM transform（CardDrawLab 方式）へ可能な限り移行し、FloatingCard 依存を軽減 |

## 次アクション
1. OperationRunner から着手し、`deck-draw` バッチ snapshot を「後状態」で持たせる PoC を実装。
2. その結果をもとに ViewManager で batch snapshot 適用フローを追加し、HandArea の DOM 更新タイミングを揃える。
3. 逐次テスト・fixtures を更新しながら、他カード移動ステージも同様のルールへ移行。
