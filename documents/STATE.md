# Statesのカテゴリ分け

## BadState：敵の攻撃などで、プレイヤーに付与される可能性があるもの
- 定義
  - プレイヤーの手札にカードとして入る可能性があるState。
- 例：
  - 腐食 CorrosionState
  - 出血 BleedState
  - 重量化 HeavyweightState
  - 軽量化 LightweightState
  - 酩酊 IntoxicationState
  - 毒 PoisonState
  - 粘液 StickyState
- 特徴
    - プレイヤーの手札にカードとして入る可能性があるため、actionsと同等のプロパティ・メソッドを持つ。
        - 例：cardDefinition, audioCue, description(), cost() などを持つ。
- 注意
  - 重量化／軽量化はバフとしての側面も持つが、プレイヤーの手札に入るものはBadStateとして扱う。

## Buff：バフ効果
- 定義
  - BadStateにもTraitに当てはまらないもの。
- 例：
  - 加速 AccelerationState
  - 打点上昇 StrengthState
  - バリア BarrierState
- 特徴
  - 主には敵のバフ行動や、プレイヤーのレリックによって付与されるもの。
  - プレイヤーの手札にカードとして入る可能性はないので、actionsと同等のプロパティ・メソッドを持つ必要はない。

## Trait：敵固有の能力
- 例：
  - ダメージ固定 FlightState
  - 鉄壁 HardShellState
  - 天の鎖無効 LargeState
  - 臆病 CowardTrait
  - 怒りの覚醒 FuryAwakeningState
  - バリア回復 GuardianPetalState
- 特徴
  - Battle中にmagnitudeが変化したり削除されたりすることがない、敵固有の能力。
  - プレイヤーの手札にカードとして入る可能性はないので、actionsと同等のプロパティ・メソッドを持つ必要はない。
  - EnemyCard内で、他のStatesとは表示を分ける。
  - isImportantフラグを持つ。その敵チームを特徴づける重要な特性にはisImportantが付き、最初の描画時に目立たせるアニメーションが付く。

# ダメージ計算に関わるStateの実行優先度
- 優先度の値が小さいほど先に処理します。
- 優先度:10 ダメージ加算系
  - 打点上昇 StrengthState
  - 腐食 CorrosionState
  - 関節損傷 JointDamageState（殴打被ダメージ+スタック値）
- 優先度:15 ダメージ乗算系・回数増減系
  - 重量化 HeavyweightState
  - 軽量化 LightweightState
  - 粘液 StickyState
  - 加速 AccelerationState
  - 弱気
- 優先度:20 ダメージ減算系
  - 鉄壁 HardShellState
- 優先度:120 被攻撃者に関わるバフ・デバフで、特定の値に固定する（代入する）もの
  - ダメージ固定 FlightState
  - バリア BarrierState

HeavyweightStateとLightweightStateをstackする状態異常に変更します。
- HeavyweightState
  - X点の時、自分が攻撃する時の打点を（2+X）/2倍にし、連続攻撃の攻撃回数を-X回する。例えば3点なら、(2+3)/2で2.5倍になる。
- LightweightState
  - X点の時、自分が攻撃する時の打点を 2/(2+X) 倍にし、連続攻撃の攻撃回数を+X回する。例えば3点なら、2/(2+3)で0.4倍になる。
