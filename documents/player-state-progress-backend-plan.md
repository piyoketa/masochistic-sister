# プレイヤー状態進行ロジックのバックエンド移管計画

## 目的
- プレイヤー画像の「状態進行」ロジックをフロント（`PlayerCardComponent`）からバックエンド（ドメイン）へ移す。
- ダメージ以外（例: 腐食付与など）でも状態進行が起きるよう拡張できるようにする。
- 状態進行が一定値に達したときに実績解除できるようにする。
- 状態進行度をバトル間で持ち越す。

## 対象範囲
- ドメイン層: 状態進行専用の管理モジュール新設（例: `src/domain/progress/PlayerStateProgressManager.ts`）。
- `src/domain/battle/Battle.ts`: 進行値を保持/更新し、Snapshot に反映する。
- `src/views/BattleView.vue` / `src/components/battle/MainGameLayout.vue` / `src/components/PlayerCardComponent.vue`:
  - 進行値を props 経由で表示に渡す。
  - 既存のフロント側進行計算ロジックを削除する。
- `src/stores/playerStore.ts`: 進行値の永続化（バトル終了時に保存・次戦で復元）。
- `src/domain/achievements/*`: 進行値到達で実績解除するためのフック。

## 進め方（詳細）
1. バックエンドの状態進行マネージャーを新設
   - 進行値（例: 1〜10）と履歴/理由を内部で保持するクラスを作成する。
   - `Battle` のコンストラクタ引数で初期値を注入できるようにする。
   - 進行値の取得/加算/上限処理をメソッド化し、フロントの判定ロジックを移管する。
2. 進行トリガーの整理と実装
   - 現在の「被ダメージ合計 >= 20」は `Battle` のダメージ処理フックで記録する。
   - 「腐食などの状態付与」時に進行させるフックを追加する（`recordAchievementStateApplied` など既存の通知ポイントを利用）。
   - 将来的な拡張に備え、進行理由を enum/文字列で管理する。
3. Snapshot への反映
   - `BattleSnapshot.player` に `stateProgressCount`（名称は要確認）を追加する。
   - `Battle.getSnapshot()` で進行値を詰め、View で参照できるようにする。
4. 表示側の配線とフロントロジック撤去
   - `BattleView` → `MainGameLayout` → `PlayerCardComponent` → `PlayerImageComponent` に進行値を 전달する。
   - `PlayerCardComponent` の `shouldAdvanceStateProgress` / `advanceStateProgress` を削除し、純粋表示コンポーネント化する。
5. バトル間の持ち越し
   - `PlayerStore` に `stateProgressCount` を追加し、セーブ対象に含める。
   - バトル終了時に `Battle` から進行値を取り出して `PlayerStore` に保存する。
   - 次戦の `createBattleFromPlayerStore` で初期値を `Battle` に注入する。
6. 実績解除との連携
   - 進行値が閾値を超えたときに `AchievementProgressManager` へ記録するインターフェースを用意する。
   - `AchievementProgress` に新しいカウントを追加するか、直接 `AchievementStore.applyProgress` に条件を追加する。
7. テスト方針
   - 進行値が Snapshot に入ることのユニットテスト。
   - 進行値が持ち越されることの統合テスト。
   - 進行値が閾値に達したとき実績が解除されることのテスト。

## 確定事項（回答反映）
1. 状態進行は「被ダメージ合計 >= 20」を維持し、腐食などの状態付与時に +1 を追加する。
2. 進行値は 1〜10 の範囲で固定し、10到達後は固定する。
3. 進行値はラン開始から持ち越し、リセット時のみ初期化する。
4. 実績解除の閾値は進行値 2/5/8/10 に到達したら称号系として解除し、各ポイントは +1 とする。
5. Snapshot フィールド名は `player.stateProgressCount` を採用する。
6. 状態付与トリガーは「腐食を付与された場合のみ」に限定する。

## 残りの確認事項
- 現時点で追加の不明点はありません。

## 想定ファイル
- `src/domain/progress/PlayerStateProgressManager.ts`（新規）
- `src/domain/battle/Battle.ts`
- `src/domain/achievements/*`
- `src/stores/playerStore.ts`
- `src/views/BattleView.vue`
- `src/components/battle/MainGameLayout.vue`
- `src/components/PlayerCardComponent.vue`
- `src/components/PlayerImageComponent.vue`
