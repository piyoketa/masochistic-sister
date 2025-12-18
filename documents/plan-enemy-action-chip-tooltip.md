## 目的
EnemyActionChip の状態異常エフェクトに hover しても tooltip が出ない不具合を解消する。既存の DescriptionOverlay を用い、カードオーバーレイとの競合を避けつつ、エフェクトの tooltip を表示できるようにする。

## 現状の調査メモ
- EnemyActionChip.vue ではエフェクトに対し `handleEnter/Move/Leave` を emit しているが、内部で DescriptionOverlay を扱っていない。
- これらの emit は EnemyNextActions -> BattleEnemyArea を経由して `action-tooltip-*` イベントとして親へ伝搬するが、これを受け取って DescriptionOverlay を制御するコンポーネントが見当たらないため、実際には tooltip が表示されない。
- EnemyCard.vue は `useDescriptionOverlay` を直接使い、自身で overlay を表示する実装になっている。

## TODO
1. Tooltip イベントの受け手が無いことを再確認する
   - `action-tooltip-*` をリッスンするコンポーネントの有無を確認し、現在のイベント経路ではオーバーレイが表示されないことをコード上で明示する。
2. EnemyActionChip で DescriptionOverlay を直接制御する実装へ変更する案を検討
   - 既存の `useDescriptionOverlay` を利用し、カードオーバーレイとは独立に tooltip を表示する。
   - もしくは Battle 層で `action-tooltip-*` をハンドルして Overlay を表示する案と比較し、影響範囲を評価する。
3. 実装
   - 選んだ案に従い、hover で tooltip 表示／移動／終了を動作させる。
   - カードオーバーレイと競合しないよう、表示優先順位をコメントで明記する。
4. テスト
   - 単体 or コンポーネントテストで、エフェクト hover 時に DescriptionOverlay の state が更新されることを確認する。
   - regress: カードオーバーレイや他要素への影響が無いことを軽く確認。

## 不明点リストと選択肢
1. Tooltip の制御場所
   - A) EnemyActionChip 内で `useDescriptionOverlay` を直接呼び出す（イベント伝搬なし）。**おすすめ：A**（影響範囲が最小で既存 EnemyCard と揃う）
   - B) Battle レベルで `action-tooltip-*` を拾い DescriptionOverlay を制御する。シーン全体の tooltip を統合できるが、追加実装箇所が増える。
2. エフェクト tooltip とカードオーバーレイの優先度
   - A) エフェクト hover では常に DescriptionOverlay を使い、カードオーバーレイは攻撃ダメージ部分のみで表示を維持。**おすすめ：A**（役割分離を維持）
   - B) すべてカードオーバーレイに統一する。実装は重く、ステートの説明にカード情報は不要なため非推奨。

この計画で問題ないか、どちらの選択肢を採用するか指示をお願いします。***
