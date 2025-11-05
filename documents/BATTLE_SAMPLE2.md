

# シナリオ2
## 1. 戦闘開始準備
### デッキの初期化
TBD

### 敵の初期化

以下の４体を「Enemy」インスタンスとして生成する。
これは、「鉄花チーム」として、EnemyTeamに登録する。

〇を付けた方の技をそれぞれの敵の最初の技とする。

- オークランサー
    - HP: 40/40
    - 技
        - 乱れ突き
            - 種別：アタック（連続攻撃）
            - 10ダメージ × 2回
        - 〇戦いの舞い
            - 種別：スキル
            - 自分の状態に、加速（1）を追加する
    - 技の発動順
        - ２つの技を交互にうつ。どちらが最初かは、初期化時にランダムに決定。
    - 特性：なし
- かまいたち
    - HP: 20/20
    - 技
        - 〇乱れ突き
            - 種別：アタック（連続攻撃）
            - 5ダメージ × 4回
        - 追い風
            - 種別：スキル
              - 対象：味方1体（新しい対象タグ）
              - 特殊効果：指定した味方1体に、State「加速(1)」を付与
                - なお、加速のmagnitudeは累積する（すでに加速(2)なら、+1されて加速(3)になる）
    - 技の発動順
        - ２つの技を交互にうつ。どちらが最初かは、初期化時にランダムに決定。
    - 特性：なし
- 鉄花
    - HP: 10/10
    - 技
        - 乱れ突き
            - 種別：アタック（連続攻撃）
            - 10ダメージ × 2回
        - 〇粘液飛ばし
            - 種別：アタック（単体攻撃）
            - 5ダメージ
            - 特殊効果：State「ねばねば(1)」を付与
    - 技の発動順
        - ２つの技を交互にうつ。どちらが最初かは、初期化時にランダムに決定。
    - 特性：守りの花びら(3)
        - 毎ターン、自分にバリア(3)を付与
          - ドローフェイズ後、処理チェックの段階に行う
          - すでにバリアを持つ場合、毎ターンmagnitudeを3にリセットする
        - バリアとは
            - 攻撃1回分を無効(0ダメージ)にする
            - 連続攻撃の場合、攻撃回数分のバリアを消費する
                - 例えば、5ダメージ × 2回の連続攻撃をバリア(3)の敵に対して使った場合、攻撃は0ダメージ × 2回になり、バリアのmagnitudeは1になる
                - 例えば、5ダメージ × 4回の連続攻撃をバリア(3)の敵に対して使った場合、最初の3回の攻撃はバリアの効果で0になり、5ダメージ × 1回が与えられる
- なめくじ
    - HP: 30/30
    - 技
        - 〇たいあたり
            - 種別：アタック（単体攻撃）
            - 20ダメージ
        - 酸を吐く：5ダメージ
            - 種別：アタック（単体攻撃）
            - 5ダメージ
            - 特殊効果：State「腐食(1)」を付与
    - 技の発動順
        - ２つの技を交互にうつ。どちらが最初かは、初期化時にランダムに決定。
    - 特性：臆病　最後の1体になったとき、逃走する

# 新概念
## バリア、連続攻撃のダメージ計算
新しいState「バリア」を導入する。
これにより、State同士で、ダメージ計算時の優先度の概念が必要になる。

計算の優先度は以下の通り。
「腐食」=「硬い殻」=「ねばねば」>「バリア」

また、UI側にダメージ計算結果を渡すときは、以下のようなオブジェクトを渡すことになる。
例えば、5ダメージ × 4回の連続攻撃をバリア(3)の敵に対して使った場合、4回の攻撃モーションがあるが、最初の3回は0ダメージで、ガードされた効果音を鳴らす。最後の1回だけ5ダメージで斬撃音を鳴らす。
[
    {damage: 0, type: "guarded"},
    {damage: 0, type: "guarded"},
    {damage: 0, type: "guarded"},
    {damage: 0, type: "slash"},
]

State「守りの花びら」は、ターンの開始時に処理を持つ。
このように、Stateには、ターン開始時に処理を起動できるものがある。
（他にも、ターン開始時に、magnitude分だけHPが減る「毒」なども存在する）
Stateのメソッドとして、ターン開始時の処理を書けるメソッドを用意すること。

### バリア・連続攻撃 実装方針メモ
- **二段階ダメージモデル**:
    - `Damages` は「ヒット前計算系（pre-hit）」と「ヒット瞬間計算系（post-hit）」の2段階を保持する。
        - Pre-hit: 現行の `amount` / `count` / `attackerStates` / `defenderStates` を元に、連撃全体を一括調整する。例：腐食・硬い殻・ねばねば・重量化など。
        - Post-hit: `DamageOutcome[]` を追加し、各ヒットの最終ダメージと `effectType`（slash/bang/guarded 等）を記録。UIはこの配列を基に演出する。
- **State分類フック**:
    - `State` に `isPreHitModifier()` を追加し、true の場合は pre-hit フェーズで `modifyPreHit({ amount, count, attacker, defender })` を呼び出す（例：腐食はダメージ+10、硬い殻はハードシェル軽減、重量化/軽量化はヒット数の増減）。
    - バリアなど post-hit 系は `onHitResolved({ index, amount, outcomes, stateData })` で1ヒットずつ処理し、ダメージを0に書き換えたり effectType を `guarded` に更新する。
    - 連撃終了後のまとめ処理が必要な場合は `onDamageSequenceResolved({ outcomes, attacker, defender, battle })` を利用する（例：守りの花びらでバリアリセット予約）。
- **DamageResolutionユーティリティ**:
    - `resolvePreHit({ attack, attacker, defender })` で pre-hit 修正を適用し、ヒットごとの配列（例： `[5,5,5,5]`）を生成。
    - `resolvePostHit({ hits, attack, attacker, defender, battle })` でバリア等を順番に適用し、最終 `DamageOutcome[]` と合計値を返す。
    - `Attack.perform` はこの2段階を経て受け取った合計ダメージで `battle.damageEnemy` / `damagePlayer` を呼び、`DamageOutcome[]` を `ActionLog` メタデータや `BattleLog` に書き込む。
        - HPが途中で0になった場合は、以降のヒットをトリムして `DamageOutcome[]` に含めない。
- **攻撃側 effectType**:
    - `Attack` に `effectType: 'slash' | 'bang' | ...` を定義（デフォルトは `'slash'`）。`DamageOutcome` の初期値はこの effectType を使用し、バリアなどの state が必要に応じて上書きする。
- **守りの花びらとバリア**:
    - `BarrierState`を新規追加し、post-hit フェーズでスタックを消費・0ダメージ化、`effectType` を `guarded` に変更。
    - `GuardianPetalState` は `onTurnStart` で `BarrierState(magnitude=3)` を強制付与/リセット。
- **テスト観点**:
    - Pre-hit のみで完結するステート（腐食等）が連撃すべてに一律適用されること。
    - バリア消費によって `DamageOutcome[]` が意図通り `guarded` を含むこと。
    - 重量化/軽量化などヒット数を変化させるステートの前段階テスト。
    - `Damages` の pre-hit / post-hit 部分が UI 表示用に正しく保持されること。
- **UI 連携**:
    - `DamageOutcome[]` を `battle.log` や `ActionLog` のメタデータに含め、フロントエンドでヒット毎の演出を再現可能にする。
    - バリア消費時の `type: 'guarded'` を UI が受け取り、ガード演出へ切り替える。
- **守りの花びら（バリア再生）**:
    - `GuardianPetalState` は `onTurnStart` で `BarrierState` を magnitude=3 まで再設定する（連撃後のまとめ処理は不要）。
- **テスト観点**:
    - 単発攻撃 vs バリア: ダメージ0・残スタック減少が正しく行われること。
    - 連撃 vs バリア: ガード回数分のヒットが `guarded` 扱いになり、残りのヒットが正しくダメージを与えること。
    - バリア復活系（守りの花びら）がターン開始時にスタックを再設定すること。
    - 既存ステート（腐食・硬い殻・ねばねば）との優先度競合テストを追加し、期待通りの順序で処理されること。

## 逃走と臆病
敵は「撃破」状態だけではなく、「逃走」状態があり得る。
敵のいずれかが「逃走」状態でも、敵が1体もいなくなれば、勝利条件は満たされる。
なお、「撃破」した敵の数がスコアになるが、「逃走」状態の敵は「撃破」にはカウントされない。

Enemy「なめくじ」は「臆病」を持つ。
敵・プレイヤーのいずれにおいても、Actionが完了した後には、判定のターンを設ける。
このタイミングで、「臆病」を持つ敵は、EnemyTeamに残っているEnemyが自分一人しかいない場合、「逃走」ステータスになる。

このように、Stateには、Actionの完了後に処理を持つものがある。
（他にも、自分がAttack Actionを使う度にmagnitude分のダメージを受ける「出血」なども存在する）
Stateのメソッドとして、ターン開始時の処理を書けるメソッドを用意すること。直前のActionの概要を受け取ること。

## 追い風
敵の技には、EnemyTeamのいずれかを指定して発動するスキルがある。

これらのカードは、行動予定が画面に表示されるタイミング、
つまり、その直前のActionをEnemyが使用し、その技を使用する直前のプレイヤーのターンが開始した瞬間に、
誰を対象にActionを発動するかを決定する。
（フロントエンドには、追い風の対象が渡され、プレイヤーは追い風の対象が誰かを知ることができる）
このタイミングで対象が1体も存在しない場合、「追い風」アクションはQueueから削除される。

Actionは、現在の盤面で発動可能かを判定するメソッドを持つ。
Enemyのactions候補からQueueにActionを入れる場合は、まずそのActionが発動可能かでフィルタリングし、候補を絞ること。

「追い風」Actionの中で、EnemyTeamの誰を対象に発動するかを判定する処理を持つ。
・現在生きている敵（撃破でも逃走でもない）のみを対象とする。
・「追い風」は、連続攻撃を持つEnemyのみを対象とする。
・自分自身も対象に含める
・EnemyTeamの時点で、Enemyの中での「選びやすさ」を設定することとができる。
　・例えば、「鉄花チーム」では、「かまいたち」がバフ対象として選ぶ確率は、オークランサー：鉄花：かまいたち自身＝5:3:1の割合である。
　・鉄花が倒されている場合は、オークランサー：かまいたち自身＝5:1になる。

対象が決定した後に、そのEnemyが倒された場合、
かまいたちは技「追い風」を使用するが、対象はいないので、何の影響もなく「追い風」の処理が終了する。

### 追い風 実装方針メモ
- **味方バフ系の共通基底**: `Skill` のサブクラスとして `AllyBuffSkill`（仮称）を新設し、味方対象バフアクションが共有するロジックを集約する。
    - `AllyBuffSkill` が `setPlannedTarget(enemyId: number | undefined)` / `getPlannedTarget()` を提供し、派生クラスは `perform` 中でそれを参照する。
    - 対象が無効化された場合に安全にスキップする処理も基底で面倒を見る。
- **追い風アクション**: `TailwindAction` は `AllyBuffSkill` を継承し、`perform` で `AccelerationState` を付与。`canUse` 判定をオーバーライドし、「加速可能タグを持つ味方が1体以上生存している」ことを条件とする。
- **Action 使用可否の判定**: `Action`（もしくは `AllyBuffSkill`）に `canUse(context)` を追加し、敵の行動キュー作成時にフィルタリングする。`EnemyActionQueue.initialize` などで利用して無効なアクションを除外する。
- **味方対象の事前決定**:
    - `Battle.startPlayerTurn` のタイミングで `EnemyTeam.planUpcomingActions(battle)` を呼び出し、各敵の次ターン行動のうち `AllyBuffSkill` を継承するものに対してターゲット選定を行う。
    - `AllyBuffSkill` は `requiresAllyTarget(): boolean` を持ち、該当するアクションだけを `EnemyTeam` が処理する。
    - 対象決定関数は `EnemyTeam.selectAllyTarget(sourceEnemy, skill)` のように実装し、タグと相性を参照して候補を抽出、重みに従ってランダム決定する。
    - 選出されたIDは `skill.setPlannedTarget(targetId)` で保持させ、対象が見つからなかった場合は `skill.setPlannedTarget(undefined)` のままにし、`planUpcomingActions` 側でキューから削除する。
- **Enemyタグ／相性の管理**:
    - `Enemy` に `allyTags: string[]` や `allyAffinity: Record<string, number>` を追加。タグは例として `['acceleratable']`（加速可能）など。
    - 追い風ではタグ `acceleratable` を持つ敵のみ対象にし、相性マップのキー（例:`'tailwind:acceleratable'`）から重みを取得。相性が設定されていない敵はデフォルト値（1）で扱うか、対象外とする。
    - 鉄花チーム: オークランサー `allyTags = ['acceleratable', 'multi-attack']`, `allyAffinity = { 'tailwind:acceleratable': 50 }`; 鉄花 `allyTags = ['acceleratable']`, `allyAffinity = { 'tailwind:acceleratable': 30 }`; かまいたち自身 `allyTags = ['acceleratable', 'multi-attack']`, `allyAffinity = { 'tailwind:acceleratable': 10 }`; かたつむりはタグ無し。
- **ターゲット未存続時の挙動**: `TailwindAction` 実行時に、保持していた対象が撃破・逃走していた場合はログを残さずに処理終了。`Enemy.act` 側は例外を投げない。
- **ログ／UI連携**: ターゲット確定時点で `Battle.log` に予告を記録し、`ActionLog.start-player-turn` 解決時に `enemyActions` の予報メタデータへ組み込む。UI はこれを参照して行動予定を描画。
- **テスト観点補足**:
    - タグ・相性設定がターゲット選択に反映される（重みの集計が正しく行われる）こと。
    - 対象が存在しないと `TailwindAction` がキューから除去されること。
    - `AllyBuffSkill` 経由の `setPlannedTarget` が `Enemy.act` の実行前後で正しく渡されること。

### 逃走・臆病 実装方針メモ
- **敵ステータス管理**: `Enemy` に `status: 'active' | 'defeated' | 'escaped'` を持たせ、`takeDamage` や逃走処理で状態を更新。`EnemyTeam.areAllDefeated` は `active` が 0 の場合に勝利とみなす（撃破と逃走の両方を対象）。
- **逃走API**: `Enemy.flee()` を追加し、ステータスを `escaped` へ変更、行動キューをクリア、`Battle.log` に逃走ログを記録。必要に応じて `Battle` が `ActionLog` に `flee` エントリを追加し、UI が逃走を検知できるようにする。
- **臆病トレイト**: `CowardTrait`（State/trait）を実装し、アクション解決後に「生存している味方が自分のみなら `Enemy.flee()` を呼び出す」ロジックを記述。
    - これを実現するため、`Action.execute` 完了時に `Battle.notifyActionResolved({ source, action })` を発火し、`EnemyTeam.handleActionResolved` → 各敵の状態が `onActionResolved` で反応できるようフックを追加。
- **ターン開始時処理**: 既存のターン開始フック同様、逃走済みの敵は `planUpcomingActions` や攻撃ターゲット選定から除外する。`AllyBuffSkill` の候補抽出でも `status === 'active'` を条件に入れる。
- **スコア/ログ**: 逃走時は撃破数にカウントしない旨をログに記録し、UI では敵カード表示を「逃走済み」表記に切り替える。`BattleSnapshot.enemies` に `status` を追加して可視化。
- **テスト観点**:
    - 臆病持ちの敵が自分ひとりになった直後に逃走すること。
    - 逃走後に追い風など味方対象スキルの候補から除外されること。
    - 全敵が撃破 or 逃走状態になった時点で `victory` が記録されること。
