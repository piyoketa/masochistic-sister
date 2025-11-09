# 効果音計画
## DamageEffects.vue
DamageEffects.vueは、DamageOutcome[]を受け取り、それを効果音を含めたダメージ演出に変換する役割を持つコンポーネントである。
DamageOutcomeは'slash'などの `effectTypeを持つ。effectTypeとダメージ量によって、再生する効果音を変える。

### effectType: slash
現状では、「乱れ突き」などの連続攻撃は全て effectType: slash である。

ダメージ量の大きさを以下の４階層に分ける。
- 0~10未満
- 10~15未満
- 15~20未満
- 20以上

### effectType: 
現状では、「たいあたり」などの効果のない単一攻撃は、このタイプに分類する。

ダメージ量の大きさを以下の４階層に分ける。
- 0~10未満
- 10~20未満
- 20~30未満
- 30以上

### effectType: 
「酸を吐く」「粘液飛ばし」などの、液体を使った攻撃はこのタイプに分類する。

このタイプではダメージ量による効果音の差は付けない。

## EnemyEffects.vue
EnemyEffects.vueは、演出が必要な時のみdisplayされ、EnemyCard全体を覆うように上に被さって描画される要素である。
主に、バフ系スキルや

### 天の鎖

### 被虐のオーラ
紫色の光が広がるような演出を付ける

## 撃破/逃走モーション




# 取ってきた場所メモ
バフ
http://www.kurage-kosho.info/battle.html
http://www.kurage-kosho.info/mp3/status03.mp3

テレポート：
http://www.kurage-kosho.info/battle.html
http://www.kurage-kosho.info/mp3/teleport01.mp3


materials/sounds/sen_ge_panchi04.mp3
鞭
https://on-jin.com/sound/sen.php
https://on-jin.com/sound/sen.php

マルチアクセント
https://on-jin.com/sound/sen.php


モンスター撃破
https://dova-s.jp/se/play344.html