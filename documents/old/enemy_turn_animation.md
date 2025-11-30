# 敵ターン演出 設計メモ（ActionLog + AnimationInstruction 方式）

本設計では、アニメーション制御を View ではなくドメイン層の ActionLog に記録し、再生時の DOM 更新・待機タイミングを `AnimationInstruction[]` として明示的に渡す。

## 1. AnimationInstruction の定義

```ts
type AnimationInstruction = {
  snapshot: BattleSnapshot      // DOM に適用すべき状態
  waitMs: number                // 次の instruction へ進むまでの待機時間
  damageOutcomes?: DamageOutcome[] // DamageEffects 表示用（任意）
  metadata?: Record<string, unknown> // 追加演出（例: enemy-id, action-name 等）
}
```

- 1 つの `BattleActionLogEntry` は 必ず 1 つ以上の `AnimationInstruction` を持つ。  
- `snapshot` は「この instruction 適用後の盤面」を表すため、DOM 更新（HP・State・カード移動など）は Battle 側で確定させておく。  
- DamageEffects や HP アニメーションは `damageOutcomes` を View が受け取り、実装する。  
- `damageOutcomes` は AttackAction が生成した配列のコピーを instruction 単位で保持し、後続の状態変化に影響されないようにする。

## 2. BattleActionLogEntry 拡張

```ts
type BattleActionLogEntry =
  | { type: 'play-card'; ...; animations: AnimationInstruction[] }
  | { type: 'enemy-act'; enemyId: number; actionId: string; animations: AnimationInstruction[] }
  | { type: 'end-player-turn'; animations: AnimationInstruction[] }
  | { type: 'victory'; animations: AnimationInstruction[] }
  | ...（他エントリも同様に animations を持つ）
```

- ActionLog に積む段階で、Battle は「カード移動」「ダメージ」「状態変化」などの各タイミングに対応するスナップショットを生成し、それぞれを `animations` に格納する。  
- 例: stage2 でオーク撃破 → なめくじ逃走のケース  
  - `play-card`: 乱れ突き操作（手札→捨て札、記憶カード生成など）  
  - `enemy-act`（kamaitachi）: HP ダメージ + オーク撃破  
  - `enemy-act`（slug flee）: 臆病で逃走  
  - `victory`: 結果オーバーレイ  
- 「被虐のオーラ」など敵の行動を即時発生させるカードも、`play-card` → `enemy-act` の 2 段構成で記録する。

## 3. ViewManager の再生ロジック

1. `ActionLogReplayer` から受け取った Entry を再生するとき、`entry.animations` をキュー化。  
2. Vue 側では `AnimationInstruction` を 1 件ずつ取り出し:  
   - `snapshot` を `update-snapshot` command で適用。  
   - `damageOutcomes` があれば `DamageEffects` を再生。  
   - `waitMs` だけ待機し、次の instruction へ進む。  
3. 全 instruction 再生後に Entry 完了扱いとなり、次の ActionLog へ進む。  
4. プレイヤー操作は animation queue が空くまでロック。スキップ時は残りの instruction を即座に消化し、最後の snapshot を適用する。

## 4. DOM 更新の責務分離

| レイヤー | 役割 |
| --- | --- |
| Battle / ActionLog | 状態遷移の記録。各 instruction 用の `BattleSnapshot` と `DamageOutcome` を生成。 |
| ViewManager | Instruction の再生（DOM 更新命令＋待機コマンドのスケジューリング）・入力ロック制御。 |
| Vue コンポーネント | `snapshot` に沿って描画。`damageOutcomes` を `DamageEffects` へ渡し、CSS でカード移動・EnemyCard fade などを実装。 |

## 5. CSS / 演出

- `DamageEffects` は `damageOutcomes` 長に応じて 0.2s 間隔で数字を表示。  
- カード移動・EnemyCard 消失は CSS Transition/Animation で統一。  
- 各 instruction の `waitMs` は CSS duration に合わせて設定する（待機が 0 の場合は次の instruction を即時実行）。  
- 「臆病」などステータス変化時のチップ表示更新は snapshot 差分で表現する。

## 6. 実装ステップ

1. **ドメイン拡張**  
   - `AnimationInstruction` 型と `BattleActionLogEntry` の `animations` 配列を追加。  
   - `Battle.executeEnemyTurn()` などで実行時に instruction を組み立て、ActionLog へ push。
2. **ViewManager 更新**  
   - Entry 再生時に `entry.animations` を順次処理する `playEntryAnimations` を実装。  
   - `AnimationCommand` に `wait` を既存利用。`DamageEffects` 連携は `custom` コマンドか Vue 側で `damageOutcomes` を watch。
3. **コンポーネント更新**  
   - `BattleView` で instruction を受け取り、DamageEffects / EnemyCard Fade / Hand animation を開始。  
   - CSS でカード移動/Enemy 消失のタイミングを `waitMs` と一致させる。
4. **テスト**  
   - `ViewManager` のユニットテストに instruction 再生ケースを追加。  
   - `Battle` のシナリオ（例: 乱れ突き→臆病→勝利）で `animations` が期待通り生成されるか検証。

## 7. 実装計画

1. **ActionLog/Instructionの土台づくり**  
   - `BattleActionLogEntry` を `animations` フィールド付きに再定義（型レベルで全エントリ必須）。  
   - `AnimationInstruction` を「差分適用」型にする例:
     ```ts
     type AnimationInstruction = {
       waitMs: number
       patch: Partial<{
         hand: HandSnapshot
         enemies: EnemySnapshot[]
         deck: number
         discard: number
         player: PlayerSnapshot
         overlays: { type: 'victory' | 'gameover' | ... }
       }>
       damageOutcomes?: DamageOutcome[]
     }
     ```
   - 差分は対象エリアだけを含み、ViewManager はパッチごとに該当コンポーネントへ状態を渡す。

2. **Battle ロジック更新**  
   - 既存の `executeEnemyTurn` / `playCard` 処理で、行動→副次イベント（臆病、マナ増加など）が1つの entry にまとまっている箇所を分割し、ActionLog へ個別 entry として push。  
   - AttackAction では `DamageOutcome[]` を記録しておき、アニメーションでも同じ配列を渡す。

3. **ViewManager 再生の差分対応**  
   - Instruction を受け取ったら `patch` を `BattleSnapshot` に適用し、該当部分だけ更新。  
   - `battleStatus` / `hand` / `enemy` などのパッチ適用ユーティリティを作る。
   - 待機時間＋再生速度・スキップ対応は既存の `wait` コマンド流用。

4. **コンポーネント調整**  
   - Hand／EnemyCard コンポーネントは `snapshot` ではなくパッチ結果を watch して更新。  
   - `DamageEffects` は `damageOutcomes` を受け取り、HP 減少アニメーションと同期。

5. **Integration テスト更新**  
   - `tests/integration/battleSample.spec.ts` および stage2 用シナリオを全面書き換え、新しい ActionLog/AnimationInstruction の構造を期待値として検証する。  
   - 具体例: オーク撃破 → なめくじ逃走 → victory の ActionLog/Instruction シーケンスを fixture 化。

6. **段階的導入**  
   - まず `play-card` のみ新フォーマットで出力 → View の処理を確認。  
   - 次に `enemy-event`（臆病逃走）、`victory`、`mana` イベントなどへ適用範囲を広げる。

## 7. 手札／デッキ／捨て札アニメーション方針

### 前提 UI
- 手札エリア右下: デッキアイコン + 残枚数。  
- 手札エリア左下: 捨て札アイコン + 枚数。  
- 並び順: 左側にスキル/アタック（古い→新しい）、右側に状態異常（古い→新しい）。

### ① デッキ → 手札
1. デッキカウントを即座に -1。  
2. デッキ位置から縮小版 ActionCard がめくられ、0.3s で挿入位置まで移動しながら拡大。  
3. 移動完了後に実カードへ差し替え。

### ② 手札 → 捨て札
1. 対象カードが 0.3s で捨て札アイコンへ移動しながら縮小＋フェード。並行して手札再配置を実施。  
2. アニメーション終了後に捨て札カウント +1、DOM から削除。

### ②’ 手札 → 消滅（消滅）
1. 対象カードがその場でワイプして消滅。手札再配置は即時開始。  
2. アニメーション終了後に DOM から削除。

### ③ 記憶カード追加
- 敵攻撃モーション終了後に ① と同フローで追加。  
- 既存カードの位置調整は 0.5s で完了。新規カードの Enter アニメーションは攻撃モーション時間＋αだけ遅延して開始。

## 8. States 表示方針

- 新規追加: チップ背景が光るアニメーションを一瞬再生（フェードなし）。  
- magnitude 更新: アニメーションなし。  
- 消滅: アニメーションなしで即削除。

## 9. その他 CSS アニメーション方針

- EnemyCard の撃破/逃走: border と背景を 1s かけてフェードアウト。  
- Victory/GameOver オーバーレイ: フェードイン＋スケールアップを 0.4s で実行。
- DamageEffects: 0.2s 間隔で値を表示し、0.8s かけてフェード＋上方向へ移動。  
- 行動中バナー: 0.3s でフェードインし、表示後すぐにフェードアウトするトランジション。

## 8. 懸念点 / 不明点

1. **差分適用の粒度**  
   - どのエリアをパッチ対象にするか要定義（hand/enemies/player/overlays など）。初期実装では `hand` と `enemy` から着手予定。
2. **DamageOutcomes の受け渡し**  
   - AttackAction が保持する `DamageOutcome[]` を再利用するため、Battle が instruction 生成時に参照できるよう API を整理する必要がある。
3. **カード移動アニメーション**  
   - CSS だけで「デッキ → 手札」「手札 → 捨て札」のパスを描画できるか、または JS 制御が必要か。
4. **再生速度変更**  
   - `waitMs` をどのように倍率計算するか（例: 0.5x, 2x）。DamageEffects 内部とも整合を取る必要がある。
5. **スキップ時の一貫性**  
   - スキップ操作で途中の instruction を飛ばす場合、DamageEffects / CSS アニメーションを即座に停止できる手段が必要。
6. **Event-driven effects**  
   - 臆病などは別 entry として ActionLog に積む方針だが、既存コードの大規模修正とテスト書き換えが必要（integration テストのシナリオを設計し直す）。  
7. **既存 UI との互換性**  
   - TitleView やデモページなど、アニメーションに依存しない画面が新フォーマットでも動作するか要確認。

## 9. その他 CSS アニメーション方針

- **EnemyCard (行動中)**: カードを 1.05 倍に拡大し、背景をやや明るいグラデーションへ変更。バナー無しでも行動中が視覚的に分かる。  
- **EnemyCard (撃破/逃走)**: Border と背景を 1 秒かけてフェードアウトしつつ縮小。  
- **Victory/GameOver オーバーレイ**: 0.4 秒でフェードイン＋スケールアップ。  
- **DamageEffects**: 0.2 秒間隔で値を表示し、0.8 秒かけてフェードしながら上方向へ移動。
