# BattleView 実装方針メモ

## 1. 目的とスコープ
- 戦闘ドメイン（`Battle` + `ActionLog`）をフロントエンドへ接続し、アニメーション付きで盤面を再生できる仕組みを整える。
- フロントの基礎ビューとして `EncounterView.vue` を `BattleView.vue` へ改名し、Vue コンポーネント群と `ViewManager`（ビューモデル）の連携仕様を先に固める。
- プレイヤー操作・アクションログ再生・アニメーション描画・スキップ／速度調整を一貫して扱える状態管理を構築する。

## 2. レイヤー構造と責務整理
- **Battle（Model）**
  - ドメインロジックと状態遷移を一元管理する。
  - `ActionLog` を元に盤面を再現できる純粋なモデルとして維持し、UI 側へイベントは直接通知しない。
  - `getSnapshot` で UI へ必要な情報を提供。
- **ViewManager（ViewModel）**
  - `Battle` と `ActionLog` を保持し、UI 再描画用のリアクティブな `ViewState` を生成。
  - プレイヤー入力をキューイングし、ドメイン操作とアニメーション再生制御を仲介。
  - 速度変更・スキップ・一時停止・巻き戻しなど UI 固有の機能をまとめて提供。
- **BattleView.vue（View）**
  - `ViewManager` が公開する state / events を購読し、Vue コンポーネントツリーを描画。
  - アニメーション命令とスナップショット差分を元に、それぞれの表示コンポーネント（敵カード・手札・ダメージ表示など）へ描画指示を伝える。

## 3. Battle ⇄ ViewManager インターフェース

### 3.1 初期化と依存注入
- `ViewManager` は以下の依存を受け取る：
  - `createBattle: () => Battle` — 新規 Battle インスタンスを構築するファクトリ。スキップ時の巻き戻しに利用。
  - `actionLog: ActionLog` — 進行中のアクションログ。`ViewManager` がプレイヤー操作や自動進行でエントリを追加する。
  - `onEvent?: (event: ViewManagerEvent) => void` — 任意のイベントハンドラ（後述）。
- 起動時に `ActionLogReplayer` を使い、`initialSnapshot` と `lastEntry` を取得する。これによりテストで作成しているサンプルログをそのままフロントでも再生できる。

```ts
export interface ViewManagerConfig {
  createBattle: () => Battle
  actionLog?: ActionLog
  playbackOptions?: {
    defaultSpeed?: number
    autoPlay?: boolean
  }
}
```

### 3.2 公開 API（案）
- `initialize(): Promise<void>` — 初期スナップショットを取得し、`ViewState` を初期化。初期化完了イベントを発火。
- `queuePlayerAction(input: PlayerInput): void` — アニメーション中はキューに積み、再生完了後に順次実行。
- `applyQueuedActions(): Promise<void>` — 入力キューを取り出して `ActionLog` へ変換し、`Battle` に適用。
- `setPlaybackSpeed(multiplier: number): void` — 状態として保持し、アニメーション命令生成時に duration を調整。
- `skipTo(targetIndex: number): Promise<void>` — `ActionLogReplayer` で `targetIndex` までを再計算し、現在進行中のアニメーションをキャンセル。
- `subscribe(listener: ViewManagerEventListener): () => void` — Vue 側でリアクティブにイベントを監視するための購読口。

```ts
type PlayerInput =
  | { type: 'play-card'; cardId: number; operations: CardOperation[] }
  | { type: 'end-player-turn' }
  | { type: 'start-battle' }
  | { type: 'set-speed'; value: number }
  | { type: 'skip-to'; index: number }
```

### 3.3 状態表現
- `ViewManager` 内部で Vue に渡す state を一元管理（Pinia or 単純な `reactive` オブジェクト）。

```ts
interface BattleViewState {
  snapshot: BattleSnapshot
  previousSnapshot?: BattleSnapshot
  actionLogLength: number
  executedIndex: number
  playback: {
    status: 'idle' | 'playing' | 'paused'
    speed: number
    queue: AnimationScript[]
    current?: {
      entryIndex: number
      resolvedEntry: ResolvedBattleActionLogEntry
    }
  }
  input: {
    locked: boolean
    queued: PlayerInput[]
  }
}
```

- `ViewManager` が `Battle` へアクションを適用するたび、`snapshot` を更新し、差分から `AnimationScript` を生成（後述）。

## 4. ViewManager ⇄ BattleView.vue インターフェース

### 4.1 イベント駆動
- `ViewManagerEvent` 例：
  - `{ type: 'state-update', state: BattleViewState }`
  - `{ type: 'animation-start', script: AnimationScript }`
  - `{ type: 'animation-complete', entryIndex: number }`
  - `{ type: 'input-lock-changed', locked: boolean }`
  - `{ type: 'error', message: string }`
- `BattleView.vue` は `onMounted` で購読処理を仕込み、`onUnmounted` で解除。
- 入力ロック中 (`input.locked === true`) はボタンを disable し、プレイヤー操作は `ViewManager.queuePlayerAction` に積むのみとする。

### 4.2 双方向操作の流れ
1. プレイヤーが UI からカードを選択 ⇒ `BattleView` が `queuePlayerAction({ type: 'play-card', ... })`。
2. アニメーションが完了 ⇒ `ViewManager` がキューを解放して `ActionLog` に書き込み、`Battle.executeActionLog` を実行。
3. 新しい `snapshot` を取得し、差分に基づく `AnimationScript` を生成 ⇒ `animation-start` イベント発火。
4. `BattleView` がアニメーションを再生し、完了時に `ViewManager.notifyAnimationDone(entryIndex)` を呼ぶ。
5. 次のログへ進む or 入力ロックを解除。

### 4.3 Vue コンポーネント側のリアクティブ構造
- `const state = useViewManagerState()` のような Composition API フックを用意し、`computed` でビュー用データを派生。
- `snapshot` と `previousSnapshot` を比較するユーティリティを用意し、敵 HP 減少などの変化だけにアニメーションを適用。
- スピード／スキップ UI からは `ViewManager` の API を直接呼び出し、副作用は `ViewManager` の state 更新を待つ。

## 5. アクションログ再生とアニメーション制御

### 5.1 AnimationScript の構造
```ts
type AnimationCommand =
  | { type: 'highlight-enemy'; enemyId: number; duration: number }
  | { type: 'apply-state'; enemyId: number; stateId: string }
  | { type: 'damage'; target: 'player' | { enemyId: number }; amount: number; hits: number }
  | { type: 'wait'; duration: number }
  | { type: 'update-snapshot'; snapshot: BattleSnapshot }

interface AnimationScript {
  entryIndex: number
  resolvedEntry: ResolvedBattleActionLogEntry
  commands: AnimationCommand[]
  metadata?: {
    canSkip: boolean
    estimatedDuration: number
  }
}
```

### 5.2 スクリプト生成の考え方
- `ResolvedBattleActionLogEntry` をキーに変換ルールをまとめるマッパーを用意。
  - `enemy-action` ⇒ 行動中ハイライト → 効果音 → HP 更新 → ダメージ演出 → 終了待ち。
  - `play-card` ⇒ 使用カードの強調 → 操作対象（敵 or 手札）へのアニメーション → スナップショット更新。
  - `start-player-turn` ⇒ ドローのアニメーションをコマンド列に分解。
- 変換時に `ViewManager` が `previousSnapshot` と `snapshot` を比較し、どの敵 HP が減ったか等を特定することで汎用的なアニメーション命令を生成する。
- 再生速度はコマンド変換時に `duration = baseDuration / playback.speed` のように反映する。

### 5.3 再生制御
- `ViewManager` は `AnimationScript` を FIFO で再生。`playback.queue` が空なら入力ロックを解除。
- スキップ要求時は：
  1. `currentAnimation` を強制終了扱いとし、残りコマンドを破棄。
  2. `ActionLogReplayer.run(targetIndex)` で盤面を再構築し、`update-snapshot` コマンドのみを発火。
- リアルタイム再生は `requestAnimationFrame` + `Promise`/`async` を使って `BattleView` 内で実装。`ViewManager` 側からは単純なシーケンスとして扱う。

## 6. BattleView.vue の設計指針

### 6.1 レイアウトと状態バインディング
- 既存の `EncounterView.vue` を `BattleView.vue` に改名した上で、以下のセクションをリアクティブに置き換える：
  - 敵リスト：`computedEnemies = computed(() => deriveEnemyViewModels(state.snapshot))`
  - 手札：`computedHand = state.snapshot.hand`
  - リソース表示（HP / マナ / 山札 / 捨て札）を snapshot から算出。
- Vue 側では `AnimationContext` を `provide` し、子コンポーネントがコマンドを受け取れるようにする。

### 6.2 アニメーションハンドラ
- `BattleView` 内で `runAnimation(script)` を実装：
  1. コマンドを逐次処理 (`for await` もしくは `reduce` + `await` )。
  2. `highlight-enemy` → 対象敵に `acting` ステートを付与⇒ CSS トランジション。
  3. `damage` → `Enemy` or `Player` コンポーネントへ命令を送信し、ダメージフローティングを表示。
  4. `update-snapshot` → `state.snapshot` を置き換える（この時点で Vue が自動差し替え）。
- `AnimationScript` 再生完了後に `ViewManager.notifyAnimationComplete(entryIndex)` を呼び、次へ進行。

### 6.3 スキップ・速度変更 UI
- 速度変更は `select` / `slider` などで `setPlaybackSpeed` を呼び出す。
- スキップは `ViewManager.skipTo(latestIndex)` を実行し、結果のスナップショットを即座に描画。
- これら操作中は `input.locked` の状態に合わせて UI を disable し、二重操作を防止。

## 7. アニメーションを持つコンポーネント設計

### 7.1 Enemy コンポーネント（`<EnemyDisplay />` などへ改修）
- **Props**
  - `model: EnemyViewModel` — HP / 状態 / traits / acting フラグなどを含む。
  - `animationChannel: AnimationChannel` — コマンド通知用（`provide/inject` で供給）。
- **内部ステート**
  - `isActing`, `isHovered`, `incomingDamageQueue`, `statesOverlay` など `ref` で管理。
  - `watch(() => model.hp.current, ...)` で HP 変化時にダメージフラッシュを起動。
- **公開メソッド**
  - `runCommand(command: EnemyAnimationCommand): Promise<void>` で `ViewManager` のコマンドを消化。
- **演出**
  - 被ダメージ：指定回数の `DamageNumber` コンポーネントをスポーン。`CSS translateY + opacity` を利用。
  - 行動中ハイライト：`acting` クラス付与で背景色や揺れなどを適用。
  - 状態変化：`state` アイコンリストを再描画し、追加時はフェードイン。

### 7.2 DamageNumber コンポーネント
- `props: { amount: number, index: number, totalHits: number }` でヒット順を管理。
- アニメーションは `transition` + `setTimeout` で 0.3 秒間隔を制御し、`playback.speed` を掛け合わせてディレイ調整。
- `ViewManager` からの命令では `hits` 回数分のダメージを生成（`Promise.all` で完了同期）。

### 7.3 Player / Hand / Card コンポーネント
- プレイヤー HP 表示も `EnemyDisplay` と同じくアニメーションチャネルを共有。
- 手札カードには `status: 'idle' | 'selected' | 'disabled'` を付け、入力ロック中は `disabled` に切り替え。
- カード再描画は `key` にカードの `id` を使い、ドローや廃棄を `TransitionGroup` で演出。

## 8. 補助ユーティリティ
- `deriveDiff(prev: BattleSnapshot, next: BattleSnapshot)`：差分（HP 減少、ステート追加、山札枚数変化など）を抽出。
- `createAnimationScript(resolvedEntry, diff, options)`：アクションログからコマンド列を生成する責務を分離し、テスト可能にする。
- `useAnimationQueue()`：`AnimationScript` を順次実行する Composition。`BattleView` が利用。
- `useInputQueue()`：UI 操作を蓄積し、`ViewManager` が処理中かどうかに応じて発火タイミングを管理。

## 9. テスト観点
- `ViewManager` 単体テスト：
  - ログを追加した際に `Battle.executeActionLog` が正しく呼ばれ、snapshot / script が生成されるか。
  - 速度変更・スキップ時に `AnimationScript` の duration が変化するか。
- `AnimationScript` マッパーテスト：
  - 各 `BattleActionLogEntry` が期待するコマンド列へ変換されるか（例：ダメージ回数や対象の特定）。
- Vue コンポーネントのテスト：
  - `EnemyDisplay` がコマンドに応じてクラスや DamageNumber を正しく制御するかを Vitest + Vue Test Utils で確認。

## 10. 実装ステップ案
1. `ViewManager` の骨格を作成し、`initialize` + snapshot 更新までを実装。
2. `BattleView.vue` へ改名し、`ViewManager` から提供される `snapshot` を描画する最小限の ViewModel を接続。
3. `ActionLog` → `AnimationScript` マッピングを MVP 版として実装（例：`enemy-action` のみ対応）。
4. `AnimationScript` 再生器と `EnemyDisplay` / `DamageNumber` コンポーネントを実装し、被ダメージ演出を再現。
5. 操作キューと入力ロックを実装し、アニメーション中の操作を抑制。
6. スキップ・速度変更 UI を追加し、`ViewManager` の API に接続。
7. 残りのアクションタイプ（カード再生、ドロー等）のアニメーションを順次拡充。
- 各ステップごとに `ActionLogReplayer` を用いたスナップショット再現を使ってビューテストを行い、挙動を検証する。

## 追加メモ: Viewからドメインへ移したい処理
- BattleView.vue 内で行っているゲームオーバー／勝利条件の判定。将来的には Battle モデル側で管理し、ビューには状態のみ通知する。
- プレイヤー操作キューのバリデーション（ターゲット選択完了済みか等）。現在は BattleHandArea で扱っているが、ViewModel 層に移してテストしやすくする余地あり。
