# isActive 伝達不備調査・修正計画

## 目的
- Action に追加した `isActive` 判定がフロント側のハンド表示・クリック可否に反映されていない原因を特定し、確実に UI へ伝搬する。
- 戦闘外（デッキ編集/報酬など）では従来通り常にプレイ可能とみなしつつ、戦闘中は `isActive=false` で確実に `disabled` を反映する。

## 影響範囲の確認対象
- Hand 表示経路: `ViewManager` → `useHandPresentation` → `HandEntry` → `CardList` / `ActionCard`。
- CardInfo ビルド: `cardInfoBuilder.resolveIsActive`、`useHandPresentation.resolveIsActive`。
- Battle コンテキストの取得: `ViewManager.battle` が null のケース（ログリプレイ/初期化前など）。
- FlashbackAction の `isActive` 実装（捨て札に攻撃が無い場合に false となるか）。

## 調査ステップ
1. **データパスの確認**
   - ハンド描画で使われる `CardInfo.disabled` の設定箇所を追跡し、`isActive` 評価に必要な context（battle/player/cardTags）が欠落していないか確認する。
   - `ViewManager` が battle インスタンスを持たない状態で `useHandPresentation` が呼ばれる経路の有無を洗い出す（ActionLog リプレイ等）。
2. **Snapshot / Battle コンテキスト不足の洗い出し**
   - `useHandPresentation.resolveIsActive` が battle 未定義の場合に常に true になっている箇所を特定し、必要なら snapshot 情報を使った fallback を検討する。
3. **CardInfo ビルドの統一**
   - `cardInfoBuilder` と `useHandPresentation` で二重実装されている `resolveIsActive` の使い分けを整理し、Battle コンテキストがある場合は必ず反映されるよう API もしくはヘルパーを一元化する案を検討する。
4. **UI 反映の確認**
   - `CardList` / `ActionCard` が `disabled` を受け取ってグレーアウト/クリック無効化しているか再確認し、必要なら手動で `disabled` フラグを設定している箇所を `isActive` 評価に置き換える。
5. **FlashbackAction の動作確認**
   - 捨て札に攻撃が無い場合に `isActive=false` となり、手札表示・クリック不可に反映されることを手動/ユニットテストで確認する。

## 実装方針案
- `isActive` の計算を共有する小ヘルパー（例: `resolveIsActiveWithContext(card, battle, source)`）を `cardInfoBuilder` か共通ユーティリティに置き、ハンド表示と他の CardInfo ビルドで同じロジックを使う。
- Battle コンテキストがない場合は従来通り true を返すが、battle がある場合は必ず `isActive` を呼ぶ。
- `ViewManager` が battle をまだ保持していないタイミングで UI が組み立てられる場合、`BattleSnapshot` から最低限のプレイヤー/カード情報を渡して判定できる形を検討する（難しければ「battle 未定義時は isActive をスキップする」ことを明示し、表示タイミングを battle 初期化後に揃える）。

## 完了条件
- ハンド表示において `isActive=false` のカードが `disabled=true` となり、クリック不可・グレーアウトが確認できる。
- 戦闘外 UI は従来通り（常に true）で挙動が変わらない。
- `FlashbackAction` の無効化条件が UI に反映されることを手動もしくはテストで確認。
- `npm run type-check` が通る。
