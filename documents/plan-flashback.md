## 計画: 新スキルカード「フラッシュバック」実装

### 目的
- コスト1のスキルカード「フラッシュバック」を追加し、捨て札のアタック1枚をランダムに手札へ加える挙動を実装する。
- 捨て札から手札へ戻すための新しいアニメーション（discard-draw。deck-drawとほぼ同じ形式で実装する。開始位置のみ捨て札）を追加し、UI/UXを破綻させずに導入する。

### スコープと完了条件
- ドメイン: Card/Action定義、Libraryへの登録、初期デッキ組込の要否判断。
- バトルロジック: 捨て札からアタックカードをランダム抽出し手札へ移動する処理を追加（手札上限考慮）。対象なし時の動作を定義しメッセージ/ログ対応。
- アニメーション: 捨て札から手札へ向かう移動演出を追加。既存 deck-draw アニメを流用し、開始位置を捨て札座標にする。
- View統合: 新ステージイベント/メタデータを ViewManager → BattleView → AnimationInstruction に接続し、手札 UI が同期する。
- テスト/検証: 型チェック・最低限のユニット or 挙動テスト（可能なら）を実施し、ビルドが通る。

### 作業ステップ
1. **カード定義**  
   - `FlashbackAction`（skill, cost 1）の追加。効果: 捨て札から attack カードをランダム1枚手札へ移動。
   - 対象なし時は使用不可。
     - Cardのメソッドに、isAvailable（利用可能フラグ）を持たせる。捨て札にアタックが存在しない場合は利用不可。フロントでも利用不可の見た目にし、クリックイベントが発動しなくする（コストが足りない時と同じ見た目）。
   - `Library` の DeckCardType へ登録し、ラベル/翻訳追加。ショップ候補へも追加。

2. **ロジック実装**  
   - Battle/Deck/Hand/DiscardPile API を使い、捨て札から攻撃カードフィルタ→ランダム抽選→移動。  
   - 移動時に ActionLog/AnimationInstruction を発行し、View 側で新アニメを再生可能にする。  

3. **アニメーション追加**  
   - 既存 deck-draw 演出を調査（開始/終了座標の決定箇所を特定）。  
   - 新イベント/メタデータ（例: `stage: 'discard-to-hand-draw'`, `metadata: { cardIds, source: 'discard' }`）を定義。  
   - BattleView で捨て札位置を取得するための参照（既存 pile overlay や座標取得関数）を追加し、開始位置を捨て札に設定。  
   - AnimationInstruction 発火→手札 UI 更新の順序を deck-draw と同等に保つ。

4. **ビュー統合**  
   - カード移動後のスナップショットを適切に反映し、手札 UI が最新状態で描画されることを確認。  
   - 必要なら SE を追加（deck draw と同一でも可）。

5. **テスト・確認**  
   - `npm run type-check`。  
   - 可能なら Action 単体テストで「捨て札攻撃あり/なし」「手札上限」ケースを検証。  
   - 手動で「捨て札からアタックを戻す」→アニメが捨て札起点で動くことを確認。

### 不明点・意思決定が必要な事項
1. **手札上限時の挙動**  
   - 選択した攻撃カードを手札に入れられない場合はどうするか？  
     - 候補: (A) 何も起こらず不発ログのみ、(B) 代わりに捨て札へ残す、(C) 山札に戻す。  
     - 推奨: (A) 不発ログのみ（他効果なし）。シンプルで既存挙動に影響が少ない。基本的には手札に入れられない状態では利用できず、かつ使用時にこのカードが捨て札に送られるので、手札が満杯であることはあり得ない。
2. **捨て札に攻撃カードがない場合**  
   - 使用できない。
3. **初期デッキ/ショップへの配置**  
   - 新カードを初期デッキやショップ候補（CARD_CANDIDATES）に含めるか？  
     - 推奨: ショップ候補に追加のみ。
4. **アニメーションの開始座標**  
   - 捨て札の座標取得方法: BattleView で pile overlay などから捨て札位置を再利用できるか？  
     - 推奨: 既存 deck draw の座標計算を確認し、類似の getter を追加して div.hand-pile 起点にする。
5. **SE/BGM**  
   - deck draw と同じ SE で良い。

### 想定ファイル変更箇所
- `src/domain/entities/actions/FlashbackAction.ts`（新規）
- `src/domain/library/Library.ts`（DeckCardType/Factory登録）
- 必要なら `src/domain/entities/decks/DefaultDeck.ts` / `ShopManager` の候補追加
- バトルロジック: ActionLog/AnimationInstruction 発火部位（既存 Action 実装内で完結の見込み）
- アニメーション: `ViewManager` / `BattleView`（捨て札起点移動の描画）
- テスト: Action 単体テスト、type-check

---

## 追加計画: Action に発動条件（isActive）概念を導入する

### 目的
- フラッシュバック実装で必要になる「使用可能かどうか」を Action 側で判定できるフックを追加し、手札表示やクリック可否に反映できるようにする。
- これを共通化することで、捨て札に攻撃カードがない場合のフラッシュバック無効化などをシンプルに実装する。

### スコープと完了条件
- `Action` 基底に発動可否を問い合わせるメソッド（例: `isActive(context)`）を追加。
- Battle/Hand 表示ロジックが `isActive` を参照して「disabled/affordable ではないがそもそも発動不可」状態を扱えるようにする。
- 既存カードの挙動に影響しない（デフォルトは常に true を返す）ことを確認。

### 作業ステップ
1. **API 追加**  
   - `ActionBase` に `isActive(context: { battle: Battle; source: Player | Enemy }): boolean` を追加し、デフォルト `true`。
   - `Skill`/`Attack` は基底実装を継承するだけ（オーバーライドなし）。

2. **コンテキストの通し方**  
   - 手札ビルド（`useHandPresentation` など）で `isActive` を評価するため、バトルとプレイヤー参照を渡して判定する。
   - 判定結果を `CardInfo.disabled` もしくは新しいフラグで反映し、ActionCard でグレーアウト・クリック無効化。

3. **フラッシュバックでの利用**  
   - 捨て札に攻撃がない場合 `isActive` が false を返すように `FlashbackAction` でオーバーライド。
   - 見た目とクリック可否が揃うことを手動確認。

4. **テスト/確認**  
   - `npm run type-check`。可能ならユニットテストで isActive=false 時にハンドが disabled になるか検証。

### 不明点・要確認事項
1. **isActive の UI 反映方法**  
   - `CardInfo.disabled` を使うか、別フラグで「使用不可だがコスト不足とは別」状態を出すか。  
   - 推奨: 現行フラグに統合（disabled=true）で簡素化する。
2. **Battle 外の表示**  
   - デッキ編集や報酬画面など、Battle コンテキストがない場面では常に true 扱いでよいか。  
   - 推奨: Battle コンテキストが無い場合は true でスルー。
