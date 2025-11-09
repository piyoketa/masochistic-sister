- スキルの「使用可能対象」の概念を導入します。
    - 「天の鎖」HeavenChainActionは、敵がState「大型」を持つ場合には選択できないようにします。
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
        
    - `TargetEnemyOperation` の生成時点で、現在のEnemyTeamに対して「使用可能／不可能」の判定を行い、`TargetEnemyOperation` の中にその情報を格納するようにしてください。選択できない敵がいる場合は、なぜ選択できないのかのコメントも`TargetEnemyOperation` の中にその情報を格納し、UI側で、敵にカーソルを合わせた時にそのコメントをoverlayとして表示するようにし、選択できないようにしてください。（例：「大型」の敵には使用できません）。

- 「被虐のオーラ」にも、「使用可能対象」の概念を導入します。
    - 「被虐のオーラ」は、その時点でプレイヤー自身に対するAttackを次の行動として予定している敵のみを対象として発動できるようにしてください。
    
- select-hand-cardのオペレーションをフロント側で実装してください


上記の修正を行います。
実装計画を立て、このドキュメントに追記してください。
仕様の不明点があれば一覧にまとめ、あなたの考える選択肢とその中のおすすめを教えてください。