---
title: AnimationBatch / ActionLog 構造の現状整理
---

## AnimationInstruction.damageOutcomes
- **現状**: `AnimationInstruction` が `damageOutcomes` を持ち、`stage === 'enemy-damage' | 'player-damage'` の際に `BattleView` / `DamageEffects` へ結果を渡している（例: `src/views/BattleView.vue:191`）。
- **課題**: ステージ metadata と別フィールドに同一情報が分離しており、ActionLogFixtures でも値が重複して記録される。
- **対応済み**: `AnimationStageMetadata`（`stage: 'enemy-damage' | 'player-damage'`）に `damageOutcomes` を含める形へ移行。View 側は event.metadata をそのまま参照するため `AnimationInstruction` からは `damageOutcomes` を削除した。

## BattleActionLogEntry
- `start-player-turn.handOverflow`
  - **用途**: `Battle.endPlayerTurn` 内で山札→手札が溢れた場合に `BattleActionLogEntry.handOverflow` をセットし、OperationRunner が `turn-start` Stage metadata に反映（`src/domain/battle/OperationRunner.ts:626`）。
  - **削除可否**: 現状 `useHandStageEvents` は `stage === 'deck-draw'` の metadata.handOverflow を見てトースト表示を出す（`src/components/battle/composables/useHandStageEvents.ts:137`）。`start-player-turn` 直下の handOverflow は OperationRunner が `deck-draw` metadata へコピーしており、本体は参照されていないため、`Entry.handOverflow` を排除して `deck-draw` の metadata のみで完結させる余地がある。

- **対応済み**: `start-player-turn` エントリから handOverflow を除去し、`turn-start` stage もシンプルなフェーズ通知のみに変更。手札上限超過は `deck-draw.metadata.handOverflow` へ集約した。


- `enemy-act.actionId`
  - **意味**: `EnemyTurnActionSummary.actionName` をコピーした文字列で、敵の「行動名」をログ/演出用に渡すための値（`OperationRunner.createEnemyActEntryMetadata` 内で設定）。
  - **型が string の理由**: Action 定義がクラス実体であり、View 側では直接参照できないため、敵の「表示名」を文字列化しておく設計。カード化と異なり ID 制度が無いため string になっている。

- **対応済み**: ActionLog / AnimationStageMetadata の両方で `actionName` に統一。fixtures も順次更新する。

- `EnemyActEntryMetadata`
  - **用途**: 敵行動の結果サマリ（手札に追加されたカード、ダメージイベント、敵ステート差分など）を `OperationLogReplayer` やデバッグツールで参照するための構造（`src/domain/battle/OperationRunner.ts:334` のコメントに記載）。ビューでは使っていないが、OperationLog を後から解析する検証系（fixtures 再生成等）で必要。

-> 特に対応はせず、そのままにします。

- `player-event / state-event`
  - **区別の理由**: `player-event` は BattleEventQueue の `subject: player` 固有イベント（マナ増減等）を指し、`state-event` は BattleStateStack の変化を操作ログとして切り出すためのエントリ。統合も可能だが、state イベントは `subject`, `stateId` を必須とする一方 player-event は `eventId` + payload の任意構造であり、1 つの union にすると型が不透明になる。また tests/integration/battleSample.spec.ts などで用途別に検証しているため、現状維持のほうが追跡しやすい。

-> 特に対応せず、そのままにします。

## AnimationStageMetadata
- `turn-start.draw / handOverflow`
  - Draw 枚数は View / fixtures でデバッグ用に参照されるのみで、演出上は `deck-draw` stage に同内容が含まれる。`handOverflow` も `deck-draw` に転写されており、`turn-start` から削除しても実害は少ない。
  - ターン開始のドロー演出自体は `deck-draw` stage (cardIds) をベースに動いており、`turn-start` を `phase開始通知` のみに縮小することは可能。

- **対応済み**: `turn-start` metadata は stage だけを持ち、draw/handOverflow は `deck-draw` バッチへ完全移行した。

- `card-move`
  - **利用箇所**: OperationRunner が `play-card` 時、カード移動先が discard/exile 以外（=単純にゾーン移動）だった場合の fallback stage として生成（`src/domain/battle/OperationRunner.ts:396`）。Fixtures / BattleHandArea.spec でも使用。
  - **削除影響**: 現状 discard/exile 以外の移動を `card-move` にフォールバックしており、削除するとデッキプレビュー系のログが欠落する。とはいえ `card-trash` / `card-eliminate` だけで十分な場合は `destination === 'hand'` ケースを deck-draw と統合する等、再設計の余地あり。

- **対応済み**: OperationRunner から `card-move` stage を排除し、`deck-draw` / `card-trash` / `card-eliminate` のみでカード移動を表現する。共有batchIdも撤廃した。

- `card-create`
  - **用途**: 敵行動による記憶カード生成（旧仕様）を表現。現在は `create-state-card` / `memory-card` へ移行済みで、OperationRunner では `card-create` を発行していない（`src/domain/battle/OperationRunner.ts` 内の `stage: 'card-create'` 参照は存在せず、fixtures でも出現しない）。
  - **結論**: 現行フローでは未使用のため、ステージ定義から削除して問題ない。ただし旧 fixture の整合性を確認する必要あり。

- **対応済み**: `AnimationStageMetadata` から `card-create` を除外し、`create-state-card` / `memory-card` のみを使用する。

- `card-trash / card-eliminate`
  - `cardTitle` (単数) は単一カード移動で fallback 表示用タイトルを渡すため、`cardTitles` は複数枚同時処理で title 配列を送るために用意されている。
  - **統一案**: `cardTitles?: string[]` だけに絞り、単一カードの場合も `[title]` で渡す形に整理できる。`BattleHandArea` は `cardTitles ?? []` で処理可能。`cardIds` のみだと手札上に存在しない（排出済み）カードの名称が解らず、トースト文言に困るため Title 情報は残す必要がある。

- **対応済み**: `card-trash` / `card-eliminate` の metadata は `cardTitles` 配列のみを持ち、単数ケースでも `[title]` へ正規化した。

- `mana.eventId`
  - BattleEventQueue によるマナ変動（イベント ID）と紐付けるためのタグ。BattleView では `mana` stage を受け取る際 ID を見ていないが、OperationRunner / fixtures でイベント追跡に使える。完全に不要ではないが、もし `eventId` を削除するなら `player-event` entry 側へメタ情報をまとめる方向になる。

-> そのままで構いません。

- `state-update`
  - 過去は「ステートの増減結果を即時反映する」ために使われていたが、現在は各バッチ snapshot が結果を含むため redundancy が大きい。OperationRunner でも発行しておらず（`stage: 'state-update'` を生成しているコードは無し）、実質使用されていないので削除可能。

- **対応済み**: `state-update` ステージを廃止し、snapshot 更新のみで状態変化を反映する。

## `deck-draw` vs `turn-start`
- ドロー処理の実体は `deck-draw` にあり、`cardIds` 情報をもとに `useHandStageEvents` がアニメーションを付ける。`turn-start` stage は UI に「ターン開始」のイベントを知らせるものとして残っているが、draw 数を stage に重複させる必要性は低い。`handOverflow` 表示も `deck-draw` へ集約したほうが単純になる。

- **対応済み**: `deck-draw` metadata に `draw` / `handOverflow` を集約し、`turn-start` からは削除した。

## その他メモ
- `EnemyActEntryMetadata` は OperationLogReplayer / fixtures 再生成で enemy 行動後の差分確認に使用されており、現時点では ActionLogEntry から除去できない。
- `damageOutcomes` を Stage metadata に移す場合、`AnimationInstruction` の他 stage に影響が無いか、BattleView の `playerDamageOutcomes` 取得処理（`src/views/BattleView.vue:191`）のリファクタが必要。
