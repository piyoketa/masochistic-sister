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