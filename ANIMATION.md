# ANIMATION実装計画

## 1. 目的と前提
- OperationRunner が生成する `AnimationInstruction[]` をフロントで順次再生し、`waitMs` に合わせて `BattleSnapshotPatch` を適用する。
- 盤面更新は **「スナップショット反映 → コンポーネント固有アニメーション」** の二層構造にする。
- ここでは「アニメーション基盤」と「各 stage の具体的な表現方針／実装 TODO」をまとめる。

## 2. AnimationInstruction 再生基盤
1. **キュー管理**
   - `ViewManager` に `instructionQueue` を追加し、`AnimationScript` 受信時に `AnimationInstruction` を展開して enqueue。
   - キューは FIFO。各 Instruction 処理中は `pending` フラグで多重再生を防ぐ。
2. **Snapshot Patch 適用**
   - Instruction ごとに `snapshot` or `snapshotPatch` を受け取り、`ViewManager.state.snapshot` を差分更新。
   - 差分適用後ただちに `hand/deck/discard` などの UI カウンタも更新される。
3. **waitMs の扱い**
   - `waitMs === 0` の場合は即座に次へ。
   - `waitMs > 0` は `await delay(waitMs)` で待機し、その間入力ロックを継続。
4. **hook**
   - Instruction metadata を `ViewManager` から `BattleHandArea` / `BattleEnemyArea` / `DamageEffects` へイベントとしてブロードキャスト。
   - 戻り値不要。各コンポーネントは受信した stage を自前キューに積んでアニメーション再生。

## 3. カード移動系ステージ

### 3.1 deck-draw
1. Snapshot 適用で手札/山札カウントを即更新。
2. `BattleHandArea` にアニメーション専用メソッドを追加:
   - ダミー `ActionCard` をデッキ座標 (右下カウンタ付近) に生成。
   - CSS transition (0.3s) で挿入先カードの位置へ移動・拡大。
   - 移動完了イベントでダミー削除 → 実カード DOM を表示。
3. `metadata.handOverflow === true` の場合:
   - 手札中央に overlay (`手札が満杯です！`) を 1.2s 表示。

### 3.2 card-trash
1. Snapshot 適用で手札/捨て札カウントを即更新。
2. 対象カード DOM をダミー枠に差し替えてから `hand-track` を再レイアウト。
3. ダミーを 0.3s で捨て札カウンタ座標へ移動＋縮小 → 終了後 DOM 破棄。

## 4. マナ更新 (stage: `mana`)
- `playerMana` の値変化時に CSS 変数でサイズ/太さを制御。
- 例: `<=0` 細字, `1-3` 標準, `>=4` 太字。transition 0.2s。
- `ViewManager` が `mana` stage を受け取ったら `BattleView` へイベント送信し、`mana-pop` に `--mana-level` を設定。

## 5. EnemyCard 演出

### 5.1 `enemy-highlight`
- `BattleEnemyArea` で対象 EnemyCard の `isActing` フラグを立て、CSS animation (0.2s) で背景をフラッシュ＋スケール 1.05。

### 5.2 撃破/逃走 (`defeat` / `escape`)
- EnemyCard `<transition-group>` に leave クラスを追加し、1s で border と背景をフェードアウト→DOM削除。
- `escape` stage も `defeat` と同じアニメーションを使い、`metadata.payload.result` で文言を出し分ける。

## 6. ダメージ演出 (`damage`, `player-damage`)
1. `DamageEffects.vue` を Enemy 列右側＆プレイヤー肖像右上に常駐させる。
2. stage 受信時に `DamageEffects.play({ target:'enemy' | 'player', outcomes })` を実行。
3. アニメーション時間は `metadata.extraWait ?? computed` を使い、`waitMs` には OperationRunner が算出した値を適用。

## 7. States 表示
- `BattleEnemyArea` の state チップに `v-for` + `<TransitionGroup name="enemy-state">`。
- enter 時は 0.2s で背景が光るアニメーション、leave/更新は即時。

## 8. Victory / GameOver オーバーレイ
- 既存 overlay を `<transition>` で包み、`opacity` + `scale` を 0.4s かけて変化。
- `victory` stage 発生時に overlay を表示、`waitMs` を尊重してフェードイン。

## 9. 実装 TODO
1. ViewManager
   - [ ] `instructionQueue` 実装・`waitMs` 対応。
   - [ ] 各 stage 向けイベントバス (`onStage(stage, metadata)`) を追加。
2. BattleHandArea
   - [ ] deck-draw/card-trash アニメーション DOM とスタイル。
   - [ ] 手札満杯 overlay。
3. Mana UI
   - [ ] `mana-pop` にレベル別スタイル。
4. BattleEnemyArea
   - [ ] enemy-highlight の CSS animation。
   - [ ] EnemyCard leave animation (defeat/escape)。
   - [ ] State enter transition。
5. DamageEffects
   - [ ] 常駐配置 + stage 連携 API。
6. Overlay
   - [ ] Victory/GameOver トランジション。

## 10. 未解決事項と方針

| 課題 | 選択肢 | 採用 |
| --- | --- | --- |
| **ステージ通知の配信方式** | (A) イベントバス<br>(B) ViewManager → BattleView → 子コンポーネント props/emit<br>(C) provide/inject で購読 | **B 採用**：ViewManager が stage/event を BattleView に emit → BattleView が `handStage`, `enemyStage` などの props で子へ伝搬。 |
| **複数カード同時移動シーケンス** | (A) 直列処理<br>(B) DOM まとめ生成<br>(C) `batchId` で同一バッチは並列再生 | **C 採用**：OperationRunner が `metadata.batchId` を付与。同じ batchId の `deck-draw` / `card-trash` は同時再生し、`waitMs` も共有。 |
| **DamageEffects 同時発生** | (A) 対象別キュー<br>(B) グローバル制御<br>(C) CSS 表現のみ | **C 採用**：ダメージは正しい `waitMs` が保証される前提で CSS アニメーションのみ。`DamageEffects` は常駐し、`play()` は最終状態のトリガのみ行う。 |

> 今後、要件が変わる場合は再検討する。現時点では invoker から props 連携／batchId 並列／CSS 演出のみ、を基準に実装を進める。
