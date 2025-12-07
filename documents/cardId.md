# 方針

デッキに加えるカード定義に関する型を、以下の４つの型に集約します。

・ActionCardId：'heaven-chain', 'tackle'など、デッキに入れることができるActionのクラス名を指定します。単なるstring。
・StateCardId：`state-${string}`など、デッキに入れることができるStateのクラス名を指定します。
・CardId: ActionCardId | StateCardId
・CardBlueprint：{
  type: CardId
  overrideAmount?: number
  overrideCount?: number
}

基本的に、報酬画面やデッキ編集画面など、フィールド上で特定のカードを指し示す場合、CardBlueprintを使う方針にします。
- ActionCardId は「クラス名 → kebab-case、末尾の Action を除去」で決定します（例: HeavenChainAction → heaven-chain）。
- StateCardId は state インスタンスの id を採用します（例: state-sticky をそのまま使用）。

# 冗長な定義の洗い出し

- src/domain/library/Library.ts: BaseDeckCardType のリテラル列挙と同じカードを baseCardFactories（Record）とactionConstructorMap（Map）で二重管理。どちらも同じアクションクラスの import 群に依存し、追加・削除のたびに3か所更新が必要。

- src/domain/shop/ShopManager.ts: ショップ候補 CARD_CANDIDATES を DeckCardType[] でハードコード。Library 側のカード一覧とは独立に手動メンテが必要。
-> LibraryにCardBlueprint[]を返す「標準商品一覧」メソッドを定義し、そちらを参照するように変更。

- src/fields/domains/FirstField.ts: ランダム報酬用 SKILL_CARD_CANDIDATES を string[] でハードコード（型は DeckCardType ではない）。FieldNode の candidateActions / selectedActions も string[] のまま。
-> LibraryにCardBlueprint[]を返す「標準報酬スキル一覧」メソッドを定義し、そちらを参照するように変更。

- src/views/ActionCardLabView.vue: ラボ表示用 cardBlueprints でデッキカード ID を手動列挙。中心の型定義と無関係に管理されている。
-> LibraryにCardBlueprint[]を返す「標準サンプルカード一覧」メソッドを定義し、そちらを参照するように変更。

- src/views/CardEliminateLabView.vue: 演出テスト用 CardCandidateKey（'heaven-chain' | 'flurry' | 'corrosion'）でカード ID を別途列挙。
-> このページを削除してください。

- src/views/RewardDemoView.vue: デモ報酬の deckType: 'heaven-chain' を固定文字列で保持（本番の型更新とは無関係に残りやすい）。
-> 「標準サンプルカード一覧」メソッドを使用してください。

# ActionCardId/StateCardId/CardId/DeckCardBlueprint と目的が近い既存型・構造

- src/domain/library/Library.ts: BaseDeckCardType（実質 ActionCardId 相当）, StateDeckCardType（state-${string}）, DeckCardType（Base+State の合成）, DeckCardBlueprint（type/overrideAmount/overrideCount を持つ）をエクスポート。現行の中核型。
-> CardBlueprintに置き換えます。

- src/stores/playerStore.ts: DeckPreviewEntry.type, addCard 引数、デッキ保存用配列などが DeckCardType/DeckCardBlueprint を再利用。
->  addCard 引数、デッキ保存用配列は、CardBlueprintに置き換えます。DeckPreviewEntryは、getDeckPreviewメソッドごと削除しましょう。

- src/domain/battle/BattleReward.ts / src/stores/rewardStore.ts: RewardCardCandidate / RewardCardEntry の deckType: DeckCardType | null が報酬カード識別に利用。
-> toRewardCardの返り値は、CardBlueprint[]に変更します。PendingReward.cardsはCardBlueprint[]にし、報酬画面側でCardBlueprint[]を表示用のCardInfo[]に変換してください。CardBlueprint[]をCardInfo[]に変換するメソッドはLibraryに持たせてください

- src/domain/shop/ShopManager.ts: CardOffer.deckType: DeckCardType（上記候補配列と連動）。
-> CardBlueprintに置き換えます。

- src/views/CardRewardView.vue / src/views/RandomCardRewardView.vue: 抽選・選択処理の candidateTypes/selectedActions/DrawnCardEntry.type に DeckCardType を使用。
-> CardBlueprintに置き換えます。

- src/fields/domains/FieldNode.ts: CardRewardNode.candidateActions / RandomCardRewardNode.selectedActions が string[]（型未統合だがカード ID を表現）。
-> CardBlueprintに置き換えます。

- src/domain/entities/states/index.ts: STATE_FACTORY のキー 'state-xxx' が State 用 ID として運用されており、StateCardId 生成と衝突しやすい領域。
-> StateCardIdを使用します。
