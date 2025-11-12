## 目的
- CardDrawLabView で確立した「DOM を手札に固定し、`transform` アニメーションでデッキ位置から吸い込む」手法を BattleHandArea の `draw-card` 演出へ適用する。
- 既存の card-create（Materialize）実装とは責務を分け、deck→hand の移動を安定化させる。
- 「一手戻す」などスナップショット巻き戻し時に破綻しないよう、HandArea 側で余計な状態を保持しない構造へ統一する。

## 実装方針（ハイレベル）
1. **状態の整理**  
   - `useHandAnimations` / `useHandStageEvents` から draw-card 関連のローカル状態（`pendingDrawCardIds`, `floatingCards` など）を洗い出し、スナップショット準拠のシンプルな構造へ再編。  
   - ドロー開始時は対象カード ID を記録する程度に留め、DOM は常に `handEntries` から描画する。
2. **DOM 参照マップの共通化**  
   - 既存の `registerCardElement` 相当の仕組みを強化し、カード ID → 要素参照を確実に保持。  
   - 差し替え時に `nextTick` で参照を取得できないケースへリトライを仕込む（最大 2〜3 フレームまで）。
3. **デッキ座標の取得 & トランスフォーム適用**  
   - BattleHandArea の deck 表示要素（既存のデッキ UI or 新設する透明ヒットボックス）への `ref` を追加。  
   - `getBoundingClientRect` を使い、カード要素とのセンター差分 + スケールを算出。  
   - `CardDrawLabView` と同等のユーティリティ（transition 付与 → `requestAnimationFrame` → transform reset → cleanup）を composable 内に実装。
4. **アニメーションフロー**  
   - `stageEvent` が `deck-draw` などを通知したタイミングで対象カード ID を記録。  
   - 実際に `handEntries` にカードが乗ったフレームで `startDrawTransformAnimation(cardId)` を呼び出し、DOM に直接 transform を適用。  
   - アニメ完了後はインラインスタイルを除去。  
   - 途中で `stageEvent` が打ち切られたり `undo` が発生した場合は `cleanupAllRunningDrawAnimations()` を呼んで即座にリセット。
5. **CSS & レイアウト**  
   - BattleHandArea 固有の CSS には draw 用の追加記述を最小限で追加（`will-change` のリセット、重なり順の制御など）。  
   - 既存の floating card スタイルとの競合を避けるため Z 軸の優先順位を定義。
6. **テスト**  
   - 既存の `tests/components/BattleHandArea.spec.ts` にドロー演出のシナリオを追加。  
   - テスト名は日本語で、「ドロー演出が完了すると手札 DOM が可視化される」などのケースを検証。  
   - DOM スタイルの直接検証が難しい場合は、アニメトリガーのフック（例: `onDrawAnimationStart` emit）をモック化して確認。

## 詳細ステップ
1. **コード調査**
   - `useHandStageEvents.ts` で `deck-draw` 系イベントの処理箇所を洗い出し、どこで `pendingDrawCardIds` 等が更新されるか確認。
   - `BattleHandArea.vue` のテンプレートでデッキを描画している DOM を特定（なければ仮の透明要素を配置）。
2. **Composable 拡張**
   - `useHandAnimations.ts` に `startDrawTransformAnimation(cardId: number)` と `cleanupDrawAnimation(cardId)` を追加。  
   - `cardId -> timeout/cleanup handle` を `Map` で保持し、component unmount 時にクリア（`try...finally` でエラーを抑制）。
   - `CardDrawLabView` で実装した `cleanupInlineAnimation` を汎用化し、共有 util として抽出する（`src/components/battle/utils/animationDom.ts` など）。
3. **DOM 参照の強化**
   - `BattleHandArea.vue` のカードループに `:ref` バインディングを追加し、Composable から提供される `registerHandCardElement` を適用。
   - `onUpdated` or `watch` で `cardId` の DOM が未取得なら次フレームで再試行。
4. **イベント駆動の更新**
   - `useHandStageEvents.ts` で `deck-draw` を受け取った際に、対象カード ID を `drawAnimationQueue` に push。  
   - `nextTick` 後に `startDrawTransformAnimation` を呼ぶことで DOM 生成〜アニメ開始の順番を保証。
5. **例外・巻き戻し対応**
   - `BattleHandArea` がアンマウントされる際、すべての `requestAnimationFrame` / `setTimeout` をクリアしてスタイルを初期化。  
   - `undo` 実行時は `drawAnimationQueue` をクリアし、トランスフォーム済み DOM が残らないようにする。
6. **テスト拡張**
   - `BattleHandArea.spec.ts` に「ドローイベントを渡したら `startDrawTransformAnimation` が呼ばれる」テストを追加（Composable をモック or spy）。  
   - `cleanup` が呼ばれることも検証。

## 不明点 / 要確認事項
| 項目 | 選択肢 | 推奨 |
| --- | --- | --- |
| デッキ位置 DOM | (a) 既存の山札表示要素を使う / (b) HandArea 内に新規で透明リファレンスを配置 | **採用: (a)** 既存デッキ UI を `ref` 化して計算元とする |
| アニメ duration | (a) 600ms 固定 / (b) stageEvent から duration 取得 / (c) 設定値を props 化 | **採用: (b)** StageEvent 等から取得できる値を使い、指示側が指定しない場合は 600ms をフォールバックとする |
| DOM 取得タイミング | (a) `nextTick` のみ（取得できなければ console.error で通知） / (b) requestAnimationFrame で複数回リトライ | **採用: (a)** `nextTick` 後に 1 度取得を試み、失敗した場合は `console.error` で計測失敗を報告してアニメをスキップ |
| ActionCard へ渡す `view-transition-name` | (a) draw アニメでは使用しない / (b) 利用して追加効果を出す | **採用: (a)** draw では `view-transition-name` を設定せず transform アニメのみ実施 |

### 追加方針
- CardDrawLabView との差分として、今回の改修で不要になる draw-card 用ローカル状態（`pendingDrawCardIds`, overlay DOM など）は積極的に削除し、BattleHandArea は snapshot 由来の handEntries だけを唯一のソースオブトゥルースとする。

上記不明点についてご意見をいただければ、最終計画に反映した上で実装へ移ります。レビューをお願いします。
