# ダメージ予測表示のバックエンド移譲計画

## ゴール
- 「次のターン終了までに受けるダメージ予測」をバックエンドで計算し、`BattleSnapshot` に載せてフロントへ渡す。
- 予測は「次の Operation が `end-player-turn` の場合にプレイヤー HP がどうなるか」を返す。
- 敵ターン中に攻撃値が変動しても、表示が破綻しない決定的な予測値を提供する。

## 現状と課題
- 現状: フロントが敵の次アクションの打点を積み上げるだけの簡易計算。攻撃回数変化や状態異常の影響を正確に反映できない。
- 課題: 敵ターン中に打点が変化したり、腐食付与などで以降のダメージが変動するケースに対応できない。

## 仕様（修正後）
- 予測を付与するタイミング: 「次が自分の行動順で、次のカード発動を待つ段階」、具体的にはプレイヤーターン中で行動待ち（ターン終了前）の時。
- 付与内容: 「このまま `end-player-turn` を行ったときのプレイヤー HP」を `BattleSnapshot` に追加（例: `predictedPlayerHpAfterEndTurn`）。
- 敵ターン中は付与しない（プレイヤー操作不可のため予測表示を不要にする）。

## 対応方針
1. **データ拡張**
   - `BattleSnapshot` に `predictedPlayerHpAfterEndTurn?: number` を追加。
2. **計算ロジック**
   - `Battle.captureFullSnapshot()` 内で、プレイヤーターンかつ入力待ち状態の場合にのみ予測を計算。
   - 計算は「現在の Battle 状態をクローン → `endPlayerTurn()` 相当をシミュレーション → シミュ後のプレイヤー HP」を取得。
   - シミュレーションは `Battle` のクローンまたは専用メソッドで副作用を隔離（元バトルを汚染しない）。
3. **フロント**
   - HPゲージや予測表示は `snapshot.predictedPlayerHpAfterEndTurn` がある時のみ描画。フロント側の加算ロジックは撤廃。

## メソッドレベルのタイミング
- `Battle.captureFullSnapshot()`  
  - 既存処理でスナップショット生成後、以下を追加:
    1. `if (this.turnValue.current.activeSide === 'player' && this.inputWaiting()) {`  
       - `inputWaiting` は既存の入力ロック/キュー状況を参照（必要なら Battle に新規ヘルパーを追加）。
    2. `const predictedHp = this.simulateEndTurnAndGetPlayerHp()`  
    3. `snapshot.predictedPlayerHpAfterEndTurn = predictedHp`
- `simulateEndTurnAndGetPlayerHp()`（新設、Battleのprivate想定）  
  - `const clone = this.cloneForSimulation()`（既存の clone/restore を流用、無ければ簡易クローンを実装）  
  - `clone.endPlayerTurn()` → 敵行動をフル実行 → 戦闘ステータス更新  
  - `return clone.player.currentHp`
- `cloneForSimulation()`  
  - 乱数シード・デッキ/手札/敵状態を含めた `FullBattleSnapshot` ベースの復元を使うと決定性を維持しやすい。  
  - 既存の `captureFullSnapshot` / `restoreFullSnapshot` があれば再利用し、シミュレーション後に元インスタンスへ影響しないようにする。

## テスト観点
- プレイヤーターン中に `predictedPlayerHpAfterEndTurn` が設定されること。
- 敵ターン中は `predictedPlayerHpAfterEndTurn` が undefined であること。
- 打点増加/腐食付与などが絡む敵行動で、シミュレーション結果が実際の敵ターン結果と一致すること。
- シミュレーションで元バトル状態が変わらないこと（スナップショット前後の差分がない）。

# 元のメモ
現在、HPゲージの表示には、このままだとどのくらいのダメージを受けるかの予測を表示する機能がありますが、この機能を根底から見直します。

- 現在の実装と課題
    - 敵の次のアクションのダメージ量を計算して表示するだけの簡素な仕組みになっています。
    - 敵の行動の中に、ダメージ量を増やす攻撃（例：腐食を付与する攻撃）があった場合、敵のターン中に敵の攻撃のダメージ量が書き換わることがあり、正しい予測になりません。
- 修正後
    - フロント側ではなく、バックエンド側で「ダメージ予測」を計算し、BattleSnapshotに付与する方式を考えます。
    - battlesnapshotの作成タイミングで、以下の条件に当てはまる場合は、ダメージ予測をBattleSnapshotに付与します。
        - 次が「自分の行動順」であり、次のカード発動を待つ段階の時
            - 例えば、敵のターン終了時や、カード使用後で「ターン終了」を押す前のタイミング
    - ダメージ予測値として、次のOperationとして「ターン終了」行った結果のプレイヤーのHPを返します。

上記の実装を行う計画を立ててください。

特にタイミングの部分が難しいと思うので、具体的な処理のタイミングをメソッドレベルで記述してください。