# プレイヤー発話の「操作開始時」再生への変更計画

## 目的
- 現状「プレイヤーターン開始時」に発話を再生している挙動を、「次の自分の操作開始時」に変更する。
- 被虐のオーラなどのアクション実行後、操作可能になった直後（入力ロック解除後）に発話が出るようにする。
- トリガーはフロント側で制御し、AnimationInstruction 連携に備えた設計を維持する。

## 対象範囲
- `src/views/BattleView.vue`: 発話キューの再生タイミングの変更、操作可能状態の検出ロジック追加。
- 必要に応じて `src/view/ViewManager.ts` / `src/domain/battle/ActionLog.ts` のイベント定義追加（フロントだけで足りない場合）。

## 進め方（詳細）
1. 現状の発話再生トリガーの把握
   - `turn-start` ステージイベントで `showNextPlayerSpeechAtTurnStart` を呼んでいる箇所を洗い出す。
   - 発話キューの現状仕様（同一reason重複排除、5秒表示）を維持する前提で整理する。
2. 「操作開始時」の定義を決定
   - `canPlayerAct` が `false -> true` になったタイミングを利用するか、
   - `isInputLocked` の解除 + プレイヤーターン中 + 選択中でないことを条件にするか、
   - もしくは `ViewManager` に「操作開始」イベントを追加し、BattleView がそれを購読するかを検討する。
3. 発話再生トリガーを切り替える
   - 2で決めたトリガーで `showNextPlayerSpeechAtActionStart` を呼ぶ。
   - 既存の `turn-start` 依存は撤去し、重複呼び出しを防止する。
4. アクション実行後の再生確認
   - 被虐のオーラなどのアクション実行後に `isInputLocked` が解除されるタイミングを確認し、発話が再生されることを確認する。
   - 連続でアクションを実行した場合に、発話が1回だけ表示されることを確認する。
5. 不要コードの削除
   - 旧トリガー（`turn-start` 依存）など不要になった処理を削除してシンプルに保つ。

## 確定事項（回答反映）
1. 「操作開始時」は `isInputLocked` 解除かつ `isPlayerTurn === true` かつ `isSelectingEnemy === false` のタイミングとする。
2. ターン開始時には発話せず、最初の入力可能状態でのみ発話する。
3. 敵選択中は再生せず、選択解除後の入力可能タイミングで再生する。

## 残りの確認事項
- 現時点で追加の不明点はありません。

## 想定ファイル
- `src/views/BattleView.vue`
- （必要なら）`src/view/ViewManager.ts`
- （必要なら）`src/domain/battle/ActionLog.ts`
