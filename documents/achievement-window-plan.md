# 実績ウィンドウ改修計画

## 目的
- 実績の「記憶ポイント」付与/消費フローを、達成実績の集計型に変更する。
- 実績ウィンドウを「報酬」「称号」タブに分割し、表示/操作を整理する。
- 不要になった状態・メソッド・DOM要素を削除し、コードを簡潔に保つ。

## 変更対象（予定）
- `src/stores/achievementStore.ts`
- `src/components/AchievementWindow.vue`
- `src/views/FieldView.vue`

## 実装方針（概要）
- 実績を「報酬（パワーアップ）」と「称号（記憶ポイント実績）」に分類する。
- 記憶ポイントはストアの getter で集計し、保持値としては持たない。
- 報酬の「所持中」合計コストと、称号の達成ポイント合計を表示し、残ポイントを算出する。

## 詳細タスク
1. **実績データ構造の整理**
   - 実績定義に `category`（`reward` / `title`）を追加し、
     - `reward` には `memoryPointCost` と `reward`（relic / max-hp など）
     - `title` には `memoryPointGain` を持たせる。
   - 既存の `reward.type === 'memory-point'` は `title` 側へ移行する。
   - 不要になった `reacquireCost`、`memoryPoints` の保持・付与/消費処理を削除する。

2. **ステータス体系の更新**
   - `AchievementStatus` を `not-achieved` / `achieved` / `owned` に変更。
   - `applyProgress` で達成条件を満たしたら `achieved` に更新する。
   - `owned` は `reward` のみで使用し、`title` は `achieved` / `not-achieved` のみとする。
   - 旧ステータス（`just-achieved` / `reacquirable`）の取り扱いを整理する。

3. **記憶ポイント集計の getters 追加**
   - `earnedMemoryPointsTotal`: `title` の `achieved` 合計。
   - `usedMemoryPointsTotal`: `reward` の `owned` 合計。
   - `availableMemoryPoints`: `earned - used`（0 未満は 0 扱い）。
   - `rewardEntriesForView` / `titleEntriesForView` を整理し、View 側の分岐を最小化する。

4. **報酬の取得処理の再設計**
   - `claimAchievement` を `reward` 専用にし、
     - `status === 'achieved'` かつ `availableMemoryPoints >= cost` の場合のみ取得可能。
     - 取得時に `reward` を適用し、`status` を `owned` に更新。
   - 「再取得」関連のロジックは撤去する。

5. **永続化（localStorage）の整理**
   - 旧 `memoryPoints` の永続化を終了し、`STORAGE_VERSION` を上げて全リセットする。
   - 旧ステータスのマイグレーション処理は行わない。

6. **AchievementWindow の UI 再構成**
   - 「報酬」「称号」のタブ UI を追加し、2 セクションを切り替え表示。
   - **報酬タブ**
     - `used/total` の記憶ポイント表示を追加（例: `12/14`）。
     - ステータスは「未達成」「達成」「所持中」のみ。
     - `達成` かつ残ポイントで取得可能な場合のみ「獲得」ボタンを表示。
   - **称号タブ**
     - 先頭に達成ポイント合計を表示。
     - 条件は細い1行のリストとして表示。
     - 達成済みは称号名（タイトル）を表示し、未達成はタイトル非表示で条件+進捗バーを表示。
   - 既存カードレイアウトで不要になる DOM/CSS を削除する。

7. **FieldView 側の連携更新**
   - `AchievementWindow` の新 props に合わせて、
     - 報酬/称号それぞれの表示用データを組み立てる。
     - 記憶ポイント合計や残量を store の getter から渡す。
   - 既存の `hasFreshAchievement` バッジは削除する。

8. **動作確認（手動）**
   - 実績達成 → 称号ポイント合計の更新。
   - 報酬の獲得可否表示と、取得後のポイント消費反映。
   - タブ切り替えと表示崩れがないこと。

## 決定事項
1. 実績の分類は `reward.type === 'memory-point'` を「称号」、それ以外を「報酬」とする。
2. 「所持中」は恒久所持（解除なし）。
3. 旧データは `STORAGE_VERSION` を上げて全リセットする。
4. 称号の達成済み表示は「称号名のみ」。
5. FieldView のバッジは削除する。
