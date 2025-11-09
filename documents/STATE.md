Enemy.addStateは、すでに同じ種類のStateが存在する場合は、Stateがstackするようにしてください。つまり、新しいStateを追加するのではなく、既存のStateのmagnitudeを追加予定のmagnitude分増加するようにしてください。

オークランサーが、すでに「加速(1)」を持っている状態で、戦いの舞いを発動した場合、加速(2)になることを確認するテストを書いてください

- State「飛行」を見直します。
    - 敵が「飛行」＋「腐食」の両方のStateを持っていても、1回のダメージが1回であることを担保するテストを追加してください。
    - 「飛行」と「腐食」のStateの順序を逆にしても同じであることを確認してください。
    - このテストが通らない場合、Stateの計算ロジックを見直す必要があります。
        - modifyPreHitを持つStateに、実行優先度を設定します。
            - 優先度の値が小さいほど先に処理します。
            - 優先度:1
                - HeavyweightState
                - LightweightState
            - 優先度:10
                - AccelerationState
                - CorrosionState
                - HardShellState
                - StickyState
                - StrengthState
            - 優先度:100
                - FlightState
        - Damages.constructorでattackerStatesを取り出してmodifyPreHitを処理するところで、Stateの優先度で並び替えてから実行するようにしてください。
        
        ```bash
            for (const state of init.attackerStates ?? []) {
              const beforeAmount = currentAmount
              const beforeCount = currentCount
              const result = state.modifyPreHit({
                amount: currentAmount,
                count: currentCount,
                type: this.type,
                role: 'attacker',
                context,
              })
              currentAmount = result.amount
              currentCount = result.count
        
              const didChange = beforeAmount !== currentAmount || beforeCount !== currentCount
              if (state.affectsAttacker() || didChange) {
                appliedAttacker.push(state)
              }
            }
        ```
        

- State「怒りの覚醒」を見直します。
    - State「怒りの覚醒」を持つ敵が、10×3の攻撃を受けた後は、StrengthState (30)を持っていることを確認するテストを書いてください。
        - StrengthState(10)が３つではなく、stackすることを確認してください。

- State「守りの花びら」のためのintegrationテストを考えます。
    - 前のターンに「バリア」を２回消費させても、次のターンには「守りの花びら」によってバリアが3に戻ることを確認するintegrationテストを書いてください。

## 実装計画
1. **Stateスタック処理の共通化**
    - `Enemy.addState` を拡張し、同一 `state.id` を持つ既存Stateがある場合は `state.stackMagnitude(newMagnitude)` のような仕組みで加算する。
    - State基底クラスに `stackWith(state: State)` などのヘルパーを追加し、magnitude非対応Stateはデフォルト処理（置き換え or 例外）を選べるようにする。
    - スタック処理を反映したユニットテスト（加速(1)へ加速(1)追加→加速(2)）を作成。
2. **Flight / Corrosion 優先度とダメージ計算ルール**
    - `State` に `priority` プロパティ（デフォルト 10）を追加し、`modifyPreHit` 実行前に優先度ソート。
    - `Damages` コンストラクタ（attackerStates/defenderStates処理）を優先度順に並び替えるよう修正。
    - Flight/Corrosion/HardShell等に優先度を定義（仕様リスト参照）し、`Flight` が常に最終計算になるよう確認。
    - Flight×Corrosion の1回ダメージ保証テストと順序入れ替えテストを追加。
3. **怒りの覚醒(フューリー・アウェイクニング)の累積確認**
    - 10×3 攻撃後に StrengthState(30) が単一Stackとして付与されるシナリオをユニットテスト化。
    - 必要に応じて FuryAwakeningState 内の `onDamageTaken` をスタック対応へ変更。
4. **守りの花びらインテグレーションテスト**
    - 1ターン目にバリア2回消費→ターン切替→花びら効果でバリア3へ復帰するシナリオを `tests/integration` に追加。
    - 既存OperationLogベースで再現し、AnimationSnapshotも最低限確認できるよう fixtures 調整。
5. **回帰テスト/リファクタ**
    - 影響範囲（EnemyState付与系、Damage計算系、既存ステートテスト）を全実行。
    - `documents/STATE.md` に実装内容を反映し、ステート優先度表を常設化。

## 仕様の不明点と提案
| 項目 | 選択肢 | 推奨 |
| --- | --- | --- |
| スタック対象外Stateの扱い | (A) 常に上書き (B) 例外を投げる (C) stackWith未実装時は1回限りで置換 | **C案 → 実装済**：`State` 基底の `stackWith` がデフォルトで合算し、スタック禁止の State のみオーバーライドして例外 or no-op を実装。 |
| magnitude無しStateの加算値 | (A) 常に1増 (B) 追加Stateのmagnitudeを優先 (C) stack不可扱い | **B案 → 実装済**：magnitude 未定義の State（例: 大型）は `stackWith` を no-op にし、重複付与しても状態が変わらない。 |
| 守りの花びらテストでのターン遷移 | (A) OperationLogに専用操作を追加 (B) 既存のバトルプリセットを流用し手動で Turn 管理 (C) バリア変化のみモック | **B案 → 実装済**：通常のターン遷移 (`battle.startPlayerTurn`) を用いた integration テストでバリアが3へ戻ることを検証。 |

- スタック禁止のStateのみ `stackWith` をオーバーライドし、例外や無処理を選択できる。特に指定が無いStateは自動でスタックする。
- magnitude を持たないState（大型、臆病など）は `stackWith` を no-op にして再付与時に変化しないようにする。
- 守りの花びらは毎ターン自動でバリアを再設定するため、特別な Operation を追加せず通常のターン処理でテストする。
