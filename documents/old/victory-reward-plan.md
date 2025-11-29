# 勝利報酬実装計画（BattleReward / RewardView）

## 目的
- BattleView 勝利時に、正式な報酬計算・受け取りフローを導入する。
- 報酬内容（HP回復、所持金、カード褒賞）を Battle の結果から算出し、RewardView でプレイヤーが受け取れるようにする。
- 受け取り完了後にフィールドへ戻し、マスをクリア扱いにする。

## 設計方針
- **BattleReward クラス**を新設し、勝利した `Battle` を入力として報酬を算出・適用する責務を持たせる。
  - 計算専用のメソッドと、実際に playerStore 等へ副作用を与えるメソッドを分離する。
  - ダメージ回復量、所持金、褒賞カード候補を一次的に保持するデータ構造を提供。
- **RewardView** を新設し、BattleView 勝利から遷移して報酬を表示・受け取り可能にする。
  - BattleView 側で計算した報酬データを一時ストア（例: rewardStore）に保存し、RewardView でそれを参照する。
  - 全報酬受け取り後にフィールドへ戻り、現在マスをクリア済みにして遷移。
- **BattleView 連携**
  - 勝利時 `.battle-victory-overlay` に「報酬を受け取る」ボタンを配置。
  - クリックで BattleReward を用いて報酬を計算→ストアへ保存→RewardView に遷移。
  - 以降のフィールド遷移で現在マスをクリア済みにする。

## 報酬仕様
- **HP回復量**: BattleReward が計算して返す（暫定: 定数またはスコア由来の簡易計算）。
- **所持金**: `撃破した敵の数 * 10 + 手札/捨て札/山札にある[新規]カード枚数`。
- **カード褒賞候補**: 手札/捨て札/山札にある `[新規]` タグ付きカード。
  - RewardView で 1 枚選択し、受け取り時に `[新規]` タグは除去してデッキに追加。

## データフロー
1. BattleView 勝利時に BattleReward を生成し、`rewardStore`（新設予定）へ `{ hpHeal, goldGain, rewardCards, defeatedCount }` などを保存。
2. BattleView の「報酬を受け取る」ボタンで `/reward` (仮) へ遷移。
3. RewardView は store からデータを読み、UI 表示・受け取り操作を提供。
4. 受け取り完了で playerStore へ HP 回復 / Gold 追加 / 選択カード追加。
5. fieldStore の現在マスをクリア済みにし、`/field` へ遷移。

## 実装タスク
1. **ドメイン: BattleReward**
   - コンストラクタで勝利済み Battle を受け取る。
   - メソッド: `computeHpHeal()`, `computeGold()`, `listRewardCards()`（[新規]タグ抽出）, `applyHpHeal(playerStore)`, `applyGold(playerStore)`, `applyCardReward(playerStore, card)`。
   - [新規]タグ ID は既存 `tag-newly-created` を利用。
2. **ストア: rewardStore（仮名）**
   - 状態: `pendingReward` (hpHeal, gold, cards, defeatedCount 等), `claimed` フラグ。
   - アクション: `setReward(payload)`, `clear()`, `claimAll({ selectedCardId })` など。
3. **RewardView**
   - GameLayout を採用。ヘッダーに HP / Gold / デッキ枚数を表示。
   - 本文で報酬リスト（HP回復量、Gold、カード候補 CardList から 1 枚選択）を表示。
   - 「受け取る」ボタン（複数段階の場合はまとめて or 項目ごと）で rewardStore → playerStore へ適用。
   - 全て受領後に「フィールドに戻る」ボタンで fieldStore をクリア処理 → `/field` へ遷移。
4. **BattleView 連携**
   - 勝利 overlay にボタン追加。クリック時:
     - BattleReward で報酬算出。
     - rewardStore へセット。
     - `router.push('/reward')`。
5. **ルーティング**
   - `/reward` 追加。
   - TitleView など必要箇所のリンク/ガード（報酬未セット時のリダイレクト）を実装。
6. **UI/アクセシビリティ**
   - CardList の選択状態を保持し、RewardView 遷移後も選択表示を維持。
   - 選択後は操作不可でも選択状態は視覚的に残す（VictoryRewardDemo の仕様踏襲）。

## 不明点と提案
1. **撃破数の算出方法**
   - 選択肢: (A) Battle の敵総数を採用（勝利=全撃破前提） (B) 戦闘ログから実際の撃破カウントを算出。
   - おすすめ: 現状仕様が明示されていないため、A を採用しつつ、将来ログベース算出に拡張可能な構造コメントを残す。
   -> 「臆病」による逃走（escape）状態は含めない。勝利後にEnemyTeamに属する敵のリストから、撃破状態の敵の数を算出。
2. **[新規]カードのソース**
   - 選択肢: (A) 勝利時点の手札/捨て札/山札のみ (B) 戦闘中に生成されたが既に消滅したカードも含める。
   - おすすめ: 仕様に従い A を採用。BattleSnapshot の各 pile から tag-newly-created を抽出。
   -> 勝利時点の手札/捨て札/山札のみ。戦闘中に生成されたが既に消滅したカードは含めない。
3. **HP回復量の計算**
   - 選択肢: (A) 定数 (B) スコア式 (C) 残HP割合など。
   - おすすめ: 現要件が未定なので、暫定定数 (例: 30〜50) で実装し、メソッドに TODO コメントで調整余地を残す。
   -> 定数。75。

上記で問題なければ実装を開始します。追加の仕様や希望があれば教えてください。
