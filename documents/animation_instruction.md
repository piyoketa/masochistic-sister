シナリオ：stage2の設定において、`play-card` によって、10×2の乱れ突きをかまいたちを使用し、かまいたちを撃破。その後、なめくじが最後の一体になったので、なめくじの「臆病」によりなめくじが逃走。敵全員がいなくなったので、勝利 `victory` となった。

このシナリオは、以下のアニメーションを持ちます。

- BattleActionLogEntry: `play-card`
    - 手札の「乱れ突き」を捨て札に移動する
    - オークに10×4ダメージ。HPが0になる。
    - オークが撃破される。
    - なめくじの臆病により、なめくじが逃走する。
- BattleActionLogEntry: `victory`
    - 結果オーバーレイが表示される。

## AnimationInstruction生成ルール（エントリ種別ごと）

| Entry type | Instruction ラフ | 待機時間 | 備考 |
| --- | --- | --- | --- |
| `battle-start` | [0] バトル初期状態 snapshot | 0ms | 手札3枚配布後の盤面を即時反映 |
| `start-player-turn` | [0] プレイヤーターン開始 snapshot | 0ms | ドロー後の手札/山札枚数を反映。`handOverflow` が true の場合でも追加指示なし |
| `play-card` | [0] カード移動、[1] ダメージ演出、[2] 撃破/逃走演出（存在する場合のみ） | 0ms / (ヒット数-1)*0.2s / 1s | 詳細後述。敵撃破がなければ [2] は省略 |
| `player-event` | [0] イベント適用後 snapshot | 200ms | 例: 戦いの準備 → マナ+1。metadata に eventId を含む |
| `state-event` | [0] State 追加/削除後 snapshot | 200ms | `subject` と `stateId` を metadata に含める |
| `enemy-act` | [0] 行動開始ハイライト, [1] ダメージ (任意), [2] 手札カード追加 (任意) | 0ms / 条件付き / 0ms | ダメージ待機: ヒット数>1 かつ手札追加なしなら (hits-1)*0.2s。手札追加あり (記憶カード生成) の場合は 0ms。主人公が敗北した場合は攻撃演出のみで終了し、手札追加はスキップして直後の `gameover` へ遷移。撃破/逃走は別途 `state-event` で表現。 |
| `end-player-turn` | [0] ターン終了 snapshot | 0ms | 自ターン終了時点の手札/マナを反映。敵行動は `enemy-act` に分離 |
| `victory` / `gameover` | [0] リザルトオーバーレイ表示 snapshot | 400ms | overlay表示を1段階で表現 |

### play-card の AnimationInstruction 詳細

BattleActionLogEntry: `play-card`のアニメーションを、最大３つのAnimationInstructionsで表現します。

- AnimationInstruction[0]：使用カードの移動
    - 手札の「乱れ突き」が「捨て札」に移動した状態のBattleSnapshotを持ちます。このBattleSnapshotでフロント側を更新します。
        - この時、カードの移動にはCSSのアニメーションが付きます。
    - 待ち時間:0s
        - CSSのアニメーションが終わるのを待たず、次のAnimationInstructionに進みます。
- AnimationInstruction[1]：ダメージ演出
    - DamageEffectsやHpGaugeのアニメーションを用いて、オークに10×4ダメージが入り、HPが0になった様子を示します。
    - オークのHPやStatesなどが更新された状態のBattleSnapshotを持ちます。このBattleSnapshotでフロント側を更新します。また、DamageOutcome[]によってダメージ演出を伝達します。
    - 待ち時間:0.6s
        - DamageEffectsは攻撃回数によって演出時間が異なります。今回は2回で、攻撃間隔ごとに0.2sの待ちが発生するので、全体では(4-1) * 0.2s = 0.6sのアニメーションが入ります。
- AnimationInstruction[2]：記憶カード追加
    - 敵の攻撃を記憶したカードがプレイヤーの手札に追加された状態を表す snapshot を持ちます。待機時間は 0ms（敵攻撃と同時に開始）。
    - metadata として `stage: 'memory-card'`, `cardTitle`, `sourceEnemyId` などを付与する。手札への挿入アニメーションは CSS 側で 0.5s ほどかけて再生。
「なめくじの臆病」による逃走は `state-event` エントリとして扱い、その `animations` で EnemyCard フェードアウトを行う（wait: 1s）。  
この後、BattleActionLogEntry: `victory` の再生が開始し、結果オーバーレイが表示されます。
