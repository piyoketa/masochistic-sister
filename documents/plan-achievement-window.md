# 実績ウィンドウ実装計画

## 目的
- FieldView のヘッダーから開ける「実績ウィンドウ」を追加し、プレイ中の達成状況と報酬取得を管理する。
- 条件達成時に報酬を受け取れる（再取得は記憶ポイント支払い）。
- 既存レリック（軽装戦闘/逆境/清廉）や記憶ポイント報酬を紐づけ、実績進行を「1プレイ内の累計」で評価する。

## 実装済み
- AchievementWindow UI と FieldView 連携（実績ボタン/バッジ表示）。
- achievementStore で実績履歴・記憶ポイントを永続化。レリック/記憶ポイント報酬の受取と再取得コスト消費をサポート。
- DeckView に履歴リセットボタンを追加（localStorage を含めて初期化）。

## 実装範囲と要件整理
- 実績一覧（7件）と報酬種別
  - 腐食累計30点獲得 → レリック「軽装戦闘」
  - 状態異常カード累計8枚獲得 → レリック「逆境」
  - 状態異常カード累計4回使用 → レリック「清廉」
  - 被虐の記憶カード累計5回使用 → 記憶ポイント+2
  - 攻撃回数5回以上の連続攻撃を獲得 → 記憶ポイント+2
  - 「臆病」な敵を撃破 → 記憶ポイント+2
  - BOSS「オークヒーロー」を撃破 → 記憶ポイント+10
- ステータス表現
  - 未達成: 達成履歴なし。進行度を持つものは現在値表示。
  - 達成直後: 今プレイで条件を満たした状態。無償で報酬受取可。
  - 再取得可能: 過去達成・報酬受取済み。記憶ポイント支払いで再取得可。
  - 獲得済み: 現在報酬を所持中。非アクティブ表示。

## 設計方針

### データモデル/状態管理
- ドメイン層に `AchievementDefinition`（id/名称/条件タイプ/閾値/報酬種別・量）と `AchievementStatus` を定義する。
- ランタイム進行度を保持する `AchievementProgress`（例: 腐食累計、状態異常入手/使用回数、記憶カード使用回数、マルチ攻撃獲得フラグ、臆病撃破フラグ、オークヒーロー撃破フラグ）を Pinia ストアで管理し、Battle 開始時に初期値を注入する。
- Battle 内で `AchievementProgressManager` を新規生成し、進行カウント・UNDO 対応・スナップショット管理を行う。Battle の「一手戻す」に同期して Manager も巻き戻す。
- 戦闘終了後（Victory 前提かどうかは要確認）に `AchievementProgressManager` の状態を Progress ストアへ反映し、閾値到達分を永続ストア（achievementStore）へ昇格させる。
- 記憶ポイント残高と過去実績履歴（達成済み/再取得済み）は achievementStore（localStorage 永続化済み）で保持し、Progress ストアとは分離する。
- 状態遷移例
  - 未達成 → 達成直後（条件到達）→ 獲得済み（無償受取）→ 再取得可能（新プレイ開始後）

### 進捗トラッキング戦略
- ActionLog/StageEvent 由来のスナップショットを優先的に参照し、Model に直接干渉しない形でカウントする方針。
- Battle の演算経路（OperationRunner/ActionLog など）でイベントをフックし、`AchievementProgressManager` に逐次通知する。通知は巻き戻し可能な操作単位（Operation ごと/カードプレイごと）で行い、Manager 内で履歴・UNDO を管理する。
- 各実績の入力ソース案
  - 腐食累計: `CorrosionState` がプレイヤーに付与された時点の増分（state magnitude 差分）を合算。記憶カード化イベントのメタデータや ActionLog の state 変化差分を利用する。
  - 状態異常カード獲得: `cardType === 'status'` または `StatusTypeCardTag` を持つカードがデッキ/手札に新規生成された瞬間をカウント（記憶カードの NewlyCreated タグも含める）。RewardView や記憶生成、MemoryManager.rememberState などの経路にフックする。
  - 状態異常カード使用: OperationRunner の play-card 実行結果から、対象カードの cardType が status の場合にカウント。
  - 被虐の記憶カード使用: カードの categoryTags に `tag-memory` が含まれる場合にカウント。
  - 連続攻撃(>=5回)獲得: 手札/デッキに新規生成された攻撃カードの `DamagePattern`/`Damages.type` が `multi` かつ基礎 count >=5 のものを検出（状態異常で count>1 になったケースで判定しない点に注意）。
  - 臆病撃破: `CowardTrait` を持つ敵が撃破/逃亡した戦闘の Victory を検出し、当該敵IDを記録。
  - オークヒーロー撃破: Battle 開始時の enemyTeam / enemy クラス名からボス戦を識別し、Victory 時にフラグを立てる。
- 進行表示用に現在値（例: 腐食累計、状態異常入手/使用回数、記憶カード使用回数）をストアで保持し、UI へ提供する。

### 永続化とリセット
- 「1プレイ中」の単位を、フィールド開始〜ゲームオーバー/報酬受取終了までのラン単位と捉え、FieldView 初期化時に進行度リセットを行う。
- AchievementProgress ストアはラン単位でリセット。Battle 開始時に初期進行度を渡し、Victory（要確認）時に最新進行度を戻す。
- 実績達成履歴と記憶ポイントは achievementStore でセッションを跨いで保持する（localStorage 永続化済み）。DeckView のリセットボタンで履歴を初期化できる。

### UI/UX
- PlayerStatusHeader の actions スロットに実績アイコンボタンを追加（Field/Battle 共通）。達成直後がある場合はバッジ/発光など強調を付ける。
- `AchievementWindow`（新規コンポーネント）で以下を表示:
  - ヘッダー: タイトル/閉じる/記憶ポイント残高表示。
  - 実績カード一覧: タイトル、条件文、現在値(ある場合)、報酬情報、状態に応じたスタイル。
  - アクション: 「報酬を獲得」「再取得」ボタン
- 進行度バー/数値を併記し、条件未達成でも現在値を見せる。達成直後は目立つ色/アイコンで区別する。

### 報酬取得ロジック
- 報酬種別ごとに処理を分岐
  - レリック: `playerStore` へ `addRelic`（重複時の扱いは要確認）。再取得時も同じAPIで追加。
  - 記憶ポイント: 実績ストアの残高を加算。
- 再取得時は記憶ポイント残高を減算し、成功時のみ状態を「獲得済み」へ（achievementStore で実装済み。コストは Definition の reacquireCost で管理）。

### 設計上の注意
- 連撃判定は DamagePattern/Damages.type を参照し、単なる count>1 でカテゴリ判定しない（攻撃カテゴリ仕様を順守）。
- Model→View の通信制約に沿い、Battle 内部状態へ直接依存せず ActionLog/Snapshot ベースで進捗を集計する。
- 既存 UI を改修した際は不要な DOM/メソッドを掃除してシンプルに保つ。

## 実施タスク案
1. 実績定義/型/ステータス遷移図の整理（domain 層に AchievementDefinition/AchievementStatus/AchievementCondition を置く）。[未]
2. AchievementProgress ストアを作成し、Battle 開始時に初期値を渡せる形へ拡張。ラン開始/リセット API を用意。[未]
3. Battle 内で AchievementProgressManager を生成し、通知API・スナップショット保存・UNDO 対応を実装（OperationRunner の「一手戻す」と同期）。[未]
4. 進捗トラッキングフックを追加（記憶生成: MemoryManager.rememberState、カード使用/生成、敵撃破、Victory）し、Manager に通知する。ActionLog/Snapshot を参照するユーティリティを実装。[未]
5. Victory/敗北終了時に Manager の状態を AchievementProgress ストアへ反映し、閾値到達分を achievementStore の履歴に昇格させる。記憶ポイント/レリック報酬は既存受取ロジックを利用。[未]
6. UI（AchievementWindow/FieldView）のデータソースを Progress ストア＋achievementStore に置き換え、進行表示を実際のカウントに同期。必要に応じてデバッグログ環境変数を追加。[未]
7. 動作確認（巻き戻し/再取得/履歴リセット、Field/Battle 両方）と不要コードの整理。[未]

## 不明点・要確認（選択肢とおすすめ）
1. **プレイ単位のリセットタイミング**
   - 「フィールド開始〜ゲームオーバー/ラン終了」単位でリセット（FieldView 初期化時にリセット）し、ラン内の複数バトルを累計する。
2. **記憶ポイントの扱い**
   - 現状は achievementStore でセッション跨ぎの永続にしている。ランごとにリセットすべきか、永続ポイントとして扱うかを確認したい（初期値0で良いか）。
3. **再取得のコストとルール**
   - 報酬ごとにコストを定義（未指定なら報酬量に合わせて提案）、条件再達成は不要で「過去に達成・受取済み」さえあれば購入可能。
4. **「獲得」判定の詳細**
   - 腐食30点: プレイヤーが受けた腐食スタックの累計で良い。敵が持つ腐食は除外？。
   - 状態異常カード獲得: デッキ追加のみカウントか、戦闘中一時カード（記憶/捨て札行き含む）もカウントか。
   - 被虐の記憶カード/状態異常カード使用: プレイヤーが play-card した場合のみで良いか（敵が使用したカードは除外？）。
   - 連続攻撃獲得: カード定義の攻撃カテゴリが multi かつ基礎 count>=5 を「獲得」とみなすタイミング（手札生成/デッキ追加のどちらか）を確認したい。
   - 臆病撃破: `CowardTrait` 持ちが逃走したケースも達成扱いか、HP0撃破のみか。
   - おすすめ: すべて「プレイヤーが得た/使った/倒した」を基準にし、戦闘中一時生成もカウントする方向で進めたいが、詳細希望。
   -> いったん、rememberStateを呼び出すたびに、実績「状態異常カード累計8枚獲得」のカウントを1進める　だけを実装対象にしましょう。それ以外の条件の実装は後回しにしてください。
5. **報酬の重複取得可否**
   - レリックは1個まで（所持中は再付与せず獲得済み状態を維持）とし、記憶ポイントのみ累積加算。
6. **ボス/臆病検出のキー**
   - 選択肢: 敵クラス名ベース（`OrcHeroEnemy`/`CowardTrait`）/ enemyTeamId ベース（例: `orc-hero-elite`）/ その他フラグ。
   - おすすめ: クラス名・State で判定し、enemyTeamId の指定があれば併用して誤検出を防ぐ。
   -> いったん、後回しにしてください。
7. **UI仕様の詳細**
   - モーダル＋トロフィーアイコン＋達成バッジ表示
8. **Battle終了時の反映タイミング**
   - 勝利のみで進捗を永続ストアへ昇格するか、敗北/逃走でも累計するか。-> 勝利時のみ履歴昇格、敗北時はラン内進行度として保持。


- 腐食累計30点獲得 → レリック「軽装戦闘」
  - フック: Player.addState で、獲得した状態異常の情報をManagerに送り、Manager側で状態異常に合わせてルーティングして最終的に recordCorrosionStack(delta) を呼ぶ。
  - 増分取得: state が CorrosionState の場合、付与前後の magnitude 差分（前を引数で受けるか、Manager 側で積み上げる）。
- 状態異常カード累計4回使用 → レリック「清廉」
  - フック: OperationRunner.playCard の処理内で、play するカードの詳細をManagerに送り、Manager側でカードの種別に合わせてカウント。
  - 巻き戻し: Operation を巻き戻す際に直近の記録を undo。
- 被虐の記憶カード累計5回使用 → 記憶ポイント+2
  - 状態異常カードと同様の流れで、type attack のカードであればカウント。
- 攻撃回数5回以上の連続攻撃を獲得
  - フック: カード生成時の入口。MemoryManager.rememberEnemyAttack（記憶攻撃生成）
  - 生成するカードの詳細をManagerに送り、Manager側でcardDefinition.cardType === 'attack' かつ DamagePattern.type === 'multi' かつ基礎 count >= 5 の場合にカウント。
- 「臆病」な敵を撃破
  - フック: 敵撃破処理 Battle.onEnemyDefeatedで、倒した敵の詳細を詳細をManagerに送り、Enemy に CowardTrait がある場合に recordCowardDefeated(enemyId)。
- BOSS「オークヒーロー」撃破（敵チーム単位） → 記憶ポイント+10
  - フック: Victory 確定処理
  - Battle.resolveVictory 相当（Victory ステージイベントを出す直前）で、倒したの詳細をenemyTeamManagerに送り、idがorc-hero-eliteなら recordOrcHeroDefeated()。

