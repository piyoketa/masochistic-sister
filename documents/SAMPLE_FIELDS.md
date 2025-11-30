SampleFieldの実装を見直します。

nextNodeIndicesは、次レベルに存在する全てのマスに進めるようにします。

- Level1：カード獲得マス１つのまま
- Level2：レリック獲得マス１つのまま
- Level3~Level6
    - １つレベルごとに、以下の候補から重複ありでランダムに３マスを選択し、配置してください。
    - 通常敵マス NormalEnemyNode 60%
        - NormalEnemyNodeの初期化時に、以下の処理をします。
            - 現在のenemyPoolの中から、ランダムに１つのEnemyTeamを選択する
            - EnemyTeamのメンバーの中から、ランダムに１つのEnemyを選択する
            - Labelとして、以下をセットする
                - 敵「（選択したEnemyの名前）」
    - ランダムカード獲得マス RandomCardRewardNode
        - NormalEnemyNodeの初期化時に、以下の処理をします。
            - candidateActionsの中から、重複なしでランダムに３枚のActionを選択します。
            - Labelとして、以下をセットする
                - カード獲得（３枚から１枚選択）
        - RandomCardRewardNodeの画面では、３枚のカードから１枚を選択し、獲得します。
            - 現在のカード獲得マスのUIを参考に、新しくViewを作成してください。
    - 固定レリック獲得マス FixedRelicRewardNode
        - FixedRelicRewardNodeの初期化時に、以下の処理をします。
            - candidateRelicsのうち、現時点でプレイヤーが獲得していないレリックを１つ選びます。
            - Labelとして、以下をセットする
                - レリック「（レリック名）」を獲得
        - FixedRelicRewardNodeの画面では、固定のレリックを獲得します。
            - すでにプレイヤーがそのレリックを持っている場合は、「獲得」ボタンを押せません。
- Level7：
    - BossEnemyNode が２つのレベルにします。
    - ボス敵マス BossEnemyNode 2つ：現在のeliteCandidatesの中から、被りがないように、２つの敵を選択します。
        - Labelとして、以下をセットする
            - BOSS「（選択したEnemyTeamの名前）」