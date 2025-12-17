# 悪魔の口づけ 実装計画

## ゴール
- レリック「悪魔の口づけ」を追加し、所持者の状態異常カード枚数に応じて「口づけ」（口技カテゴリ）の打点が上昇するようにする。
- 新カテゴリタグ「口技」と新状態「艶唇」を導入し、口技にのみ加算バフを適用できる仕組みを整備する。

## 実装タスク
1. **カードカテゴリタグの追加**
   - `CardCategoryTag` 派生で「口技」タグを新設（ID・名称・説明を付与）。
   - `cardTags/index.ts` へエクスポート追加。必要に応じてカードタグドキュメントも更新。
2. **BloodSuckAction（口づけ）へのタグ付与**
   - `cardDefinition.categoryTags` に新設の「口技」タグを付与し、他挙動（ドレインなど）は維持。
3. **状態「艶唇」の実装**
   - `BuffState` 派生で追加。`modifyPreHit` で攻撃側かつ攻撃の `categoryTags` に「口技」が含まれる場合のみ打点を `+magnitude` する（StrengthState 相当の加算ロジック、JointDamageState を参考に対象絞り込み）。
   - 説明文・優先度・ファクトリ登録（`STATE_FACTORY`）を追加。
4. **レリック「悪魔の口づけ」の実装**
   - `getAdditionalStates` で `player.countBaseStatusStates() * 10` を magnitude とした「艶唇」を付与する。`isActive` は状態異常カードが1枚以上ある場合に true とする想定（AdversityExcitementRelic を踏襲）。
   - relic の登録（`relicLibrary`, `relics/index.ts`, `DEFAULT_PLAYER_RELICS`, `Library.ts` のレリック一覧など）と説明・アイコンを設定。
5. **ドキュメント整備**
   - カードタグ一覧（`documents/CARD_TAGS.md`）に「口技」を追記。
   - レリック一覧ドキュメント（`documents/RELIC.md` など必要箇所）に「悪魔の口づけ」を追記。

## テスト観点
- 「艶唇」が付与された攻撃者の口づけ（BloodSuckAction）が magnitude 分だけ打点上昇すること。
- 「艶唇」を持っていても、口技タグを持たない攻撃の打点が変化しないこと。
- レリック「悪魔の口づけ」が状態異常カード枚数に応じた magnitude で「艶唇」を付与すること（0枚なら付与なし/非アクティブの扱いも確認）。
- 既存の StrengthState など他バフとの併用で正しく加算されること（ダメージパターン single/multi に依存しない）。

## 不明点・要確認（選択肢と提案）
- **口技タグの ID/表記**  
  - 選択肢: `tag-oral-technique`（英語基調）, `tag-kiss-technique`（口づけ特化）, `tag-oral`（短縮）。  
  - 提案: 他カテゴリと並べやすい `tag-oral-technique` を採用（name は「口技」）。
- **艶唇の優先度/カテゴリ**  
  - 選択肢: 優先度10で加算バフ扱い（Strength 同列）、優先度15で倍率系と同列。  
  - 提案: Strength と同様に優先度10・加算バフ（BuffState）とし、他の乗算系と順序衝突を避ける。
- **レリックのアクティブ条件**  
  - 選択肢: 状態異常カードが0枚でもアクティブで magnitude=0 を返す / 1枚以上でのみアクティブ。  
  - 提案: AdversityExcitementRelic と同じく1枚以上でアクティブにして UI 上の無効化判定を揃える。
- **レリックアイコン**  
  - 選択肢: `👄`, `💋`, `😈`。  
  - 提案: 直感的に「口づけ」を示せる `💋` を使用（他レリックと同程度の視認性）。
