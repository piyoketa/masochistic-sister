# 効果音計画
## DamageEffects.vue
DamageEffects.vueは、DamageOutcome[]を受け取り、それを効果音を含めたダメージ演出に変換する役割を持つコンポーネントである。
DamageOutcomeは'slash'などの `effectTypeを持つ。effectTypeとダメージ量によって、再生する効果音を変える。

### effectType: slash
現状では、「乱れ突き」などの連続攻撃は全て effectType: slash である。

ダメージ量の大きさを以下の４階層に分ける。
- 0~10未満: taira-komori_punch2a.mp3
- 10~15未満: on-jin_punch04.mp3
- 15~20未満: soundeffect-lab_punch3.mp3
- 20以上

### effectType: slam
現状では、「たいあたり」などの効果のない単一攻撃は、このタイプに分類する。

ダメージ量の大きさを以下の４階層に分ける。
- 0~10未満
- 10~20未満
- 20~30未満
- 30以上

### effectType: spit
「酸を吐く」「粘液飛ばし」などの、液体を使った攻撃はこのタイプに分類する。
このタイプではダメージ量による効果音の差は付けない。

## EnemyEffects.vue
EnemyEffects.vueは、演出が必要な時のみdisplayされ、EnemyCard全体を覆うように上に被さって描画される要素である。
主に、バフ系スキルや

### 天の鎖

### 被虐のオーラ
紫色の光が広がるような演出を付ける

## 撃破/逃走モーション


# それぞれのSEの取得元
- 小森平
  - taira-komori_punch2a.mp3: [軽打2a](https://taira-komori.net/sound/attack01/punch2a.mp3)
- On-Jin ～音人～
  - 商業利用の場合は、利用詳細のご連絡が必要
  - on-jin_punch04.mp3 [手足・殴る、蹴る04](https://on-jin.com/sound/listshow.php?pagename=sen&title=%E6%89%8B%E8%B6%B3%E3%83%BB%E6%AE%B4%E3%82%8B%E3%80%81%E8%B9%B4%E3%82%8B04&janl=%E6%88%A6%E9%97%98%E7%B3%BB%E9%9F%B3&bunr=%E6%8B%B3%E3%80%81%E8%B9%B4&kate=%E4%BD%93)
- 効果音ラボ
  - soundeffect-lab_punch3.mp3 [打撃3](https://soundeffect-lab.info/sound/battle/)
- [くらげ工房](http://www.kurage-kosho.info/battle.html)
  - kurage-kosho_gun-fire02.mp3 [銃器・発砲02](http://www.kurage-kosho.info/battle.html)