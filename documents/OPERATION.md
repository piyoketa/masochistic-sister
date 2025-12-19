- スキルの「使用可能対象」の概念を導入します。
    - 「天の鎖」HeavenChainActionは、敵がState「天の鎖無効」を持つ場合には選択できないようにします。
    - 現在、この処理はHeavenChainAction.perform() の中で処理していますが、変えましょう。
        
        ```bash
            if (target.getStates().some((state) => state instanceof LargeState)) {
              context.battle.addLogEntry({
                message: `${target.name}は巨大な体で鎖を振り払った！`,
                metadata: { enemyId: target.id, action: 'heaven-chain-immune' },
              })
              return
            }
        ```
        
    - `TargetEnemyOperation` の生成時点で、現在のEnemyTeamに対して「使用可能／不可能」の判定を行い、`TargetEnemyOperation` の中にその情報を格納するようにしてください。選択できない敵がいる場合は、なぜ選択できないのかのコメントも`TargetEnemyOperation` の中にその情報を格納し、UI側で、敵にカーソルを合わせた時にそのコメントをoverlayとして表示するようにし、選択できないようにしてください。（例：「天の鎖無効」の敵には使用できません）。

- 「被虐のオーラ」にも、「使用可能対象」の概念を導入します。
    - 「被虐のオーラ」は、その時点でプレイヤー自身に対するAttackを次の行動として予定している敵のみを対象として発動できるようにしてください。
    
- select-hand-cardのオペレーションをフロント側で実装してください


上記の修正を行います。
実装計画を立て、このドキュメントに追記してください。
仕様の不明点があれば一覧にまとめ、あなたの考える選択肢とその中のおすすめを教えてください。

## 実装計画
1. **使用不可敵の判定データを TargetEnemyOperation に付与**
    - Operation 生成時に Battle/EnemyTeam へアクセスし、各敵の「選択可否」「理由テキスト」を計算して Operation インスタンスに格納するフィールド（例: `availability: Record<enemyId, { selectable: boolean; reason?: string }>`）を追加。
    - HeavenChainAction / MasochisticAuraAction など個別スキルは「対象候補を列挙するメソッド」を通じて条件を宣言する形へ変更し、perform 内からは消滅処理を削除。
2. **HeavenChainAction の天の鎖無効制限を Operation レイヤーへ移動**
    - LargeState を持つ敵を Operation 生成時点で `selectable: false` にし、理由メッセージ（例: `天の鎖無効の敵には天の鎖を使えません`）を付与。
    - perform では Operation が保証するため追加チェックを外しログ出力も Operation 経由（必要なら別ステージ）で行う。
3. **MasochisticAuraAction の対象制限**
    - 敵の次行動キューを参照し、`target === 'player'` かつ `category === 'attack'` な敵のみを selectable とするロジックを Operation 側へ追加。
    - 選択不可の敵には「次の行動がプレイヤー攻撃ではありません」などの理由を保持。
4. **UI (BattleEnemyArea / EnemyCard) のホバー挙動**
    - `TargetEnemyOperation` の availability 情報を `viewManager` → `BattleView` → `BattleEnemyArea` に渡し、敵カードホバー時に reason を overlay 表示。
    - selectable=false の敵にはクリックイベントを無効化し、カーソルも変更。
5. **select-hand-card Operation のフロント実装**
    - BattleHandArea が OperationQueue から要求を受け取り、手札カードを選択可能なダイアログ/オーバーレイで提示。選んだカード ID を OperationRunner に返却する UI フローとバリデーションを追加。
6. **テスト & ドキュメント更新**
    - OperationRunner / ActionLog のユニットテストで selectable ロジックを検証。
    - Component テストで hover overlay・クリック無効化を確認。
    - 戦闘シナリオの integration テストで MasochisticAuraAction の対象選別が働くかを確認。

## 仕様の不明点と提案
| 項目 | 選択肢 | 推奨 |
| --- | --- | --- |
| 理由テキストの保持形式 | (A) `string` のみ<br>(B) 多言語対応オブジェクト<br>(C) コード + フロント側辞書 | **A（決定）**：Operation 生成時に日本語文字列を保持し、そのまま UI で表示。 |
| MasochisticAura の「次行動」判定 | (A) 直近の EnemyQueue の先頭のみ<br>(B) 連続行動を含む全予定<br>(C) 直近ターンの AttackIntent フラグ | **A（決定）**：各敵のアクションキュー先頭のみを参照し、プレイヤー攻撃かどうかで使用可否を判定。 |
| select-hand-card UI | (A) BattleHandArea 内でポップアップを表示<br>(B) グローバルモーダル<br>(C) 現状同様にプレイヤー操作で代替 | **A（決定）**：BattleHandArea 内に専用ポップアップを表示し、カード選択・確定・キャンセルを完結させる。 |
