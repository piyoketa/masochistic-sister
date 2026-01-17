# プレイヤー立ち絵切替ロジックの改修計画

## 目的
- `VITE_NEW_PLAYER_IMAGE_LOGIC=true` のときに新しい立ち絵切替ロジックへ切り替える。
- 既存のHP依存表示は維持し、環境変数で切替可能にする。
- ダメージが20を超えたタイミングで「状態進行イベント」を発火し、新ロジックの画像更新に反映する。

## 対象範囲
- `src/components/PlayerCardComponent.vue`: 状態進行イベントの発火ロジック追加。
- `src/components/PlayerImageComponent.vue`: 新しい表示ロジックの追加と環境変数切替。
- 必要に応じてテスト追加（既存テスト環境に合わせる）。

## 進め方（詳細）
1. 既存実装の把握と環境変数の扱い方の決定
   - `VITE_NEW_PLAYER_IMAGE_LOGIC` を参照する前提で、既存の環境変数運用と揃える。
   - `PlayerImageComponent` と `PlayerCardComponent` の責務コメントに、新ロジックの役割が合うよう必要なら追記する。
2. `PlayerCardComponent` に「状態進行イベント」発火ロジックを追加
   - `outcomes` 更新時のタイミングで、ダメージ合計を算出する（連続攻撃は合計値）。
   - 合計ダメージが `20` を超えた場合のみ、状態進行カウントを +1 する。
   - 二重発火を避けるために、前回処理した `outcomes` と比較して発火済み判定を行う（例: 参照変化時のみ or 合計値と件数で判定）。
   - 新ロジックに伝えるための `stateProgressKey`/`stateProgressCount` などの値を `PlayerImageComponent` に渡す。
3. `PlayerImageComponent` に新ロジックを実装
   - `VITE_NEW_PLAYER_IMAGE_LOGIC` が有効な場合は、`/assets/players/new_images/{n}.png` を表示する。
   - 画像の切り替えは「状態進行イベント」ごとに `1 -> 2 -> ... -> 10` と進め、10到達後は固定する。
   - 初期表示は `1` を使う。
   - 既存ロジック（HP依存）と分岐し、旧ロジックは維持する。
   - 画像プリロードの対象も、環境変数に応じて切り替える。
4. テスト方針の検討
   - 既存テスト環境がVueコンポーネントテストを許容する場合、以下を検討する。
     - 「20ダメージ超過で状態進行イベントが発火する」テスト（日本語名で記述）。
     - 「新ロジック時に `new_images` のパスが使われる」テスト（日本語名で記述）。
   - テスト追加が難しい場合は、手動確認手順を明文化する。
5. 不要コードの削除
   - 旧ロジック用の値が不要になった場合は削除し、シンプルさを保つ。

## 確定事項（回答反映）
1. 環境変数は `VITE_NEW_PLAYER_IMAGE_LOGIC` を新設し、`import.meta.env` で参照する。
2. 状態進行カウントは 10 で打ち止め（以降は 10 固定）。
3. 「20ダメージ超え」は実際の被ダメージ合計（`DamageOutcome.damage` 合計）で判定する。
4. 状態進行イベントは `outcomes` 更新時に即時発火する。
5. 連続攻撃は合計値で1回だけ発火する。

## 残りの確認事項
- 現時点で追加の不明点はありません。

## 想定ファイル
- `src/components/PlayerCardComponent.vue`
- `src/components/PlayerImageComponent.vue`
- 追加テストファイル（必要時）
