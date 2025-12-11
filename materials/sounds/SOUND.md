# 効果音計画
## DamageEffects.vue
DamageEffects.vueは、DamageOutcome[]を受け取り、それを効果音を含めたダメージ演出に変換する役割を持つコンポーネントである。
DamageOutcomeは `effectType` を持つ。`effectType` とダメージ量によって、再生する効果音を変える。

- `src/utils/damageSounds.ts` に `damageSoundAssets` / `resolveDamageSound` を定義
- `src/utils/audioPreloader.ts` で効果音を事前にロード（`DamageEffects` 初期化時に実行）
- `/demo/damage-effects` で複数シナリオを切り替え、効果音の組み合わせを確認できる

effectTypeが指定されていない、もしくは音声ファイルが存在しない場合は
デフォルト音声として、一回攻撃(type: single)なら effectType: slam を、連続攻撃なら effectType: slash と同じ音声を流す。

| effectType | damage区分 | ファイル |
|------------|------------|----------|
| slash | 0~10未満 | public/sounds/slash/taira-komori_punch2a.mp3 |
| slash | 10~15未満 | public/sounds/slash/taira-komori_medium_punch1.mp3 |
| slash | 15~20未満 | public/sounds/slash/taira-komori_heavy_punch1.mp3 |
| slash | 20以上 | public/sounds/slash/taira-komori_kick1.mp3 |
| slam | 0~10未満 | public/sounds/slam/taira-komori_punch2a.mp3 |
| slam | 10~20未満 | public/sounds/slam/on-jin_punch04.mp3 |
| slam | 20~30未満 | public/sounds/slam/soundeffect-lab_punch3.mp3 |
| slam | 30以上 | public/sounds/slam/kurage-kosho_gun-fire02.mp3 |
| spit | 全て | public/sounds/spit/on-jin_nukarumu01.mp3 |
| poison | 全て | public/sounds/poison/kurage-kosho_poison3.mp3 |

### effectType: slash
現状では、「突き刺す」などの連続攻撃は全て effectType: slash である。

ダメージ量の大きさを以下の４階層に分ける。
- 0~10未満: taira-komori_punch2a.mp3
- 10~15未満: taira-komori_medium_punch1
- 15~20未満: taira-komori_heavy_punch1
- 20以上: taira-komori_kick1

### effectType: slam
現状では、「殴打」などの効果のない単一攻撃は、このタイプに分類する。
ダメージ量の大きさを以下の４階層に分ける。それぞれに対応する効果音のファイル名を記載する。

materials/sounds/slam　以下のファイルより
- 0~10未満: taira-komori_punch2a.mp3
- 10~20未満: on-jin_punch04.mp3
- 20~30未満: soundeffect-lab_punch3.mp3
- 30以上: kurage-kosho_gun-fire02.mp3

### effectType: spit
「溶かす」「体液をかける」などの、液体を使った攻撃はこのタイプに分類する。
このタイプではダメージ量による効果音の差は付けない。

materials/sounds/spit より
- 全てのダメージ: on-jin_nukarumu01.mp3

### effectType: poison
「毒針」などの、毒メインの攻撃はこのタイプに分類する。
このタイプではダメージ量による効果音の差は付けない。

materials/sounds/poison より
- 全てのダメージ: on-jin_nukarumu01.mp3

# スキルの音

## 被虐のオーラ
- skills/kurage-kosho_teleport01.mp3

# それぞれのSEの取得元
- 小森平
  - taira-komori_punch2a.mp3: [軽打2a](https://taira-komori.net/sound/attack01/punch2a.mp3)
  - taira-komori_medium_punch1: [中打](https://taira-komori.net/sound/attack01/medium_punch1.mp3)
  - taira-komori_heavy_punch1: [重打１](https://taira-komori.net/sound/attack01/heavy_punch1.mp3)
  - taira-komori_kick1: [蹴り（重い打撃）](https://taira-komori.net/sound/attack01/kick1.mp3)
- On-Jin ～音人～
  - 商業利用の場合は、利用詳細のご連絡が必要
  - on-jin_punch04.mp3 [手足・殴る、蹴る04](https://on-jin.com/sound/listshow.php?pagename=sen&title=%E6%89%8B%E8%B6%B3%E3%83%BB%E6%AE%B4%E3%82%8B%E3%80%81%E8%B9%B4%E3%82%8B04&janl=%E6%88%A6%E9%97%98%E7%B3%BB%E9%9F%B3&bunr=%E6%8B%B3%E3%80%81%E8%B9%B4&kate=%E4%BD%93)
  - on-jin_nukarumu01 [泥・ぬかるみ](https://on-jin.com/sound/listshow.php?pagename=sei&title=%E6%B3%A5%E3%83%BB%E3%81%AC%E3%81%8B%E3%82%8B%E3%81%BF&janl=%E7%94%9F%E6%B4%BB%E7%B3%BB%E9%9F%B3&bunr=%E6%B0%B4%E5%91%A8%E3%82%8A%E3%81%9D%E3%81%AE%E4%BB%96&kate=%E6%B0%B4%E5%91%A8%E3%82%8A)
- 効果音ラボ
  - soundeffect-lab_punch3.mp3 [打撃3](https://soundeffect-lab.info/sound/battle/)
  - public/sounds/fields/gold.mp3[お金を落とす2](https://soundeffect-lab.info/sound/various/)
  - public/sounds/fields/gain_hp.mp3[ゲージ回復3](https://soundeffect-lab.info/sound/button/)
  - public/sounds/card-animations/draw.mp3[カードを台の上に出す](https://soundeffect-lab.info/sound/various/various3.html)
- [くらげ工房](http://www.kurage-kosho.info/battle.html)
  - 商用利用無料
  - kurage-kosho_gun-fire02.mp3 [銃器・発砲02](http://www.kurage-kosho.info/battle.html)
  - kurage-kosho_poison3.mp3 [毒３](http://www.kurage-kosho.info/battle.html)
  - kurage-kosho_teleport01.mp3 [テレポート01](http://www.kurage-kosho.info/battle.html)
  - kurage-kosho_status03.mp3 [テレポート01](http://www.kurage-kosho.info/battle.html)
  - kurage-kosho_button45.mp3[ボタン45](http://www.kurage-kosho.info/system.html)
  - kurage-kosho_esc01.mp3[逃走](http://www.kurage-kosho.info/battle.html)
- [OtoLogic](https://otologic.jp/free/license.html)
  - クレジットを表記すれば無料
  - public/sounds/skills/OtoLogic_Electric-Shock02-Short.mp3[電撃02](https://otologic.jp/free/se/electric-shock01.html#google_vignette)
- 魔王魂
  - public/sounds/defeat/maou_se_battle18.mp3[戦闘18](https://maou.audio/se_battle18/#google_vignette) 撃破の音
  - public/sounds/defeat/maou_se_battle18.mp3 [オノマトペ・光る](https://otologic.jp/free/se/flash01.html#google_vignette) 被虐のオーラ
  - public/sounds/bgm/gameover.mp3[アコースティック43](https://maou.audio/bgm_acoustic43/)
- [DOVA-SYNDROME](https://dova-s.jp/_contents/license/)
  - 著作権表示・提供等の表示は不要
  - public/sounds/bgm/battle.mp3[タクティカルエンカウンター](https://dova-s.jp/bgm/play18089.html)