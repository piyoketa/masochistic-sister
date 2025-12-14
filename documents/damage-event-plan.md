## ダメージイベント刷新・攻撃ダメージと特殊ダメージの切り分け計画

### 目標
- ダメージ発生を `DamageEvent`（攻撃由来）と「特殊ダメージ」（毒・瘴気など攻撃以外のHP減少）で明確に分離する。
- プレイヤー被弾時の同期ダメージ（ダメージ連動・瘴気）を安全に実装できる拡張ポイントを用意する。
- `takeDamage` は「攻撃ダメージ専用」にし、特殊ダメージは別メソッド経由で処理して無限ループを防ぐ。

### 追加・更新する型
```ts
// 攻撃由来のダメージイベント
export interface DamageEvent {
  actionId: CardId            // 必須: どの行動/カード由来か
  attacker: Actor             // 攻撃者
  defender: Actor             // 被攻撃者
  outcomes: DamageOutcome[]   // ヒット数・ダメージ量など
  effectType?: DamageEffectType
}

// 攻撃者/被攻撃者の表現
export type Actor =
  | { type: 'player' }
  | { type: 'enemy'; enemyId: number }
```

### API方針
- `Player.takeDamage` / `Enemy.takeDamage`
  - 引数を `DamageEvent` ベースに変更（攻撃ダメージ専用）。
  - `recordDamageAnimation` へそのまま渡す。
  - プレイヤー側は `handlePlayerDamageReactions(event: DamageEvent)` を呼び出し、同期ダメージ（ダメージ連動/瘴気）の起点にする。
- 特殊ダメージ用メソッド（例）
  - `Player.applySpecialDamage(amount: number, context?: { reason: string; battle?: Battle })`
  - `Enemy.applySpecialDamage(amount: number, context?: { reason: string; battle?: Battle })`
  - これらは攻撃者情報を持たず、反応ステートを極力呼ばない（必要なら限定的に呼ぶ）。`recordDamageAnimation` は状況に応じて付与。
  - 瘴気自傷や毒など、攻撃に起因しないHP減少はこちらを利用し、`takeDamage` を経由しないことで無限ループを防ぐ。
- `Battle`
  - `recordDamageAnimation` / `consumeDamageAnimationEvents` を `DamageEvent` ベースに刷新。
  - `handlePlayerDamageReactions(event: DamageEvent)` をプレイヤー被弾時に呼び出し、ここで「ダメージ連動」「瘴気同期ダメージ」を計算し、`scheduleSynchronizedEnemyDamage` で enemy-damage を積む。
  - `scheduleSynchronizedEnemyDamage(event: DamageEvent)` の中身は後実装（バッチに enemy-damage を追加）。

### 同期ダメージ（ダメージ連動 / 瘴気）の挙動
- プレイヤーが攻撃ダメージを受けたとき、`handlePlayerDamageReactions` で:
  - ダメージ連動: 付与された敵全員に `DamageEvent.outcomes` をそのままコピーした enemy-damage を追加。
  - 瘴気: 攻撃者が敵の場合のみ、`outcomes` のヒット数に合わせて「1ヒット=magダメージ」で enemy-damage を追加（effectType は瘴気用に区別）。
- defeat/victory の優先度は現行どおり defeat 優先を維持。同期ダメージでも通常ダメージと同じフローで defeat/victory を判定。

### 実装ステップ（骨子）
1. 型更新
   - `DamageEvent` と `Actor` を新設し、`DamageAnimationEvent` を置き換え。
   - `Battle`, `OperationRunner` のダメージ関連シグネチャを `DamageEvent` に更新。
2. API骨組み
   - `Player/Enemy.takeDamage` を攻撃専用にし、`applySpecialDamage`（名称は要検討）を追加。
   - `Battle.handlePlayerDamageReactions` / `scheduleSynchronizedEnemyDamage` を `DamageEvent` 受け口で残す（中身は後実装）。
3. フロント/アニメーション
   - OperationRunner 側で `DamageEvent` を消費して player-damage / enemy-damage をバッチ化する既存フローを型に合わせて調整（ロジックは維持）。
4. カード/ステート
   - 命の鎖: 敵に「ダメージ連動」を付与する Skill を追加。
   - 瘴気: プレイヤーに「瘴気」を付与する Skill と State を追加し、被弾時に同期ダメージを発火（後続実装）。

### 残課題
- 特殊ダメージメソッドの正式名称/シグネチャ決定。
- 瘴気・ダメージ連動用アイコン/サウンド/表示テキストの確定。
- DoT（毒など）が演出を出すかどうかの方針（出す場合は `applySpecialDamage` にアニメーションオプションを追加）。

