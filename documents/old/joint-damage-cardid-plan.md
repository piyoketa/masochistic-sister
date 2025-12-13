# JointDamageState で CardId を参照できるようにする計画

## 背景と課題
- 現状の `JointDamageState` は `modifyPreHit` 内で攻撃の種類を `constructor.name` などから判定しているが、`Damages` や `DamageCalculationParams` に CardId/ActionId が含まれず、前段のフロントエンド（敵行動予測やオーバーレイ表示）側で安定して判定できない。
- `JointDamageStateAction` の効果（殴打のみ加算）を UI 側のダメージ計算にも反映するには、カード識別子を計算パイプラインに通す必要がある。

## 目標
- `Damages` と `DamageCalculationParams` に CardId（`CardBlueprint.type` 相当）を保持し、攻撃計算時に識別子が参照できるようにする。
- `JointDamageState.modifyPreHit` は CardId を用いて対象かどうかを判定する。
- 敵行動予測などフロント側のダメージ表示でも、同じ CardId ベースの補正がかかるようにする。

## 変更方針
1. **型拡張**  
   - `Damages` に `cardId?: CardId` を追加し、コンストラクタ引数・シリアライズ/コピー周りも対応する。
   - `DamageCalculationParams` にも `cardId?: CardId` を追加し、`Attack.calcDamages` などから伝播させる。
2. **供給元**  
   - `Attack.calcDamages` 呼び出し時に、元のカード/アクションから CardId を解決し、`Damages` に渡す。
   - 敵行動予測で生成する `Damages`（`enemyActionHintBuilder` 内など）でも CardId を設定する。
3. **利用先更新**  
   - `JointDamageState.modifyPreHit` で CardId を見て対象を判定する（`cardId === 'tackle'` など、正規の CardId に合わせる）。フォールバックで従来の constructor.name 判定も残すかは確認。
4. **表示ロジック確認**  
   - CardInfo 生成やオーバーレイ表示で `modifyPreHit` が反映されることを確認する。必要なら `buildCardInfoFromCard`/`buildCardInfoFromBlueprint` に cardId を渡す仕組みを追加。

## 不明点と確認事項
1. CardId の命名規則: 既存 `toActionCardId` の kebab-case で統一か？  
   - 推奨: `CardBlueprint.type` と同じ文字列を採用（例: `tackle`）。  
2. 既存 `Damages` のシリアライズ箇所: BattleSnapshot などに追加した際の互換性は問題ないか？  
   - 推奨: 追加フィールドはオプショナルにし、既存データとの互換を保つ。  
3. `JointDamageState` の対象判定で constructor.name フォールバックを残すか？  
   - 推奨: CardId 優先、undefined 時のみ constructor.name を参照する二段構え。

## 実装ステップ案
1. 型拡張: `CardId` import を追加し、`Damages` と `DamageCalculationParams` に `cardId?: CardId` を追加。コンストラクタ/clone/serialize なども対応。  
2. 供給: `Attack.calcDamages` で `toActionCardId` を使い CardId を取得し、`Damages` 生成時にセット。敵行動ヒント生成用の `Damages` でも同様に設定。  
3. `JointDamageState.modifyPreHit` を CardId 判定ベースに書き換え、フォールバック挙動を整理。  
4. フロント表示確認: 敵行動予測オーバーレイで計算が反映されるか手動チェック。必要ならオーバーレイ用ダメージ計算に cardId を渡す処理を追加。  
5. 回帰確認: 既存のダメージ計算・カード生成が壊れていないことを軽く手動確認（テストがあれば実行）。
