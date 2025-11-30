# State三分類リファクタ計画（BadState / Buff / Trait）

## 目的
- State を BadState / Buff / Trait に明確分類し、型と責務を整理する。
- BadState はカードとして扱えるよう Action/StateAction を用意し、コスト計算（酩酊含む）を統一する。
- BattleSnapshot にカテゴリと isImportant を載せ、表示側（EnemyCard 等）の表現を強化する。

## 仕様方針
- BadState: 手札に入る／カード化される状態。`cardDefinition`/`cost()`/`audioCue` など Action 相当のプロパティを持つ。
  - 対象: Corrosion/Bleed/Heavyweight/Lightweight/Intoxication/Poison/Sticky など。
- Buff: バフ系（手札に入らない）。カード情報は不要。
  - 対象: Acceleration/Strength/Barrier など。
- Trait: 敵固有。`isImportant` を持てる（枠ぽよん演出）。カード情報は不要。
  - 例: Flight/HardShell/Large/Coward/FuryAwakening/GuardianPetal など。
  - チームごとに重要 Trait を指定可能。
    - SnailTeam: HardShell
    - TestEnemyTeam: HardShell
    - HummingbirdAlliesTeam: Flight（ハチドリ）
    - IronBloomTeam: GuardianPetal（守りの花びら）
    - OrcHeroEliteTeam: Large / FuryAwakening
    - TestSlug5HpTeam: なし（isImportant指定不要）
- Snapshot 拡張: 各 State に `category: 'bad' | 'buff' | 'trait'` と `isImportant?: boolean` を付与。
  - EnemyCard で Trait を別セクション表示。isImportant は初回描画で枠がぽよんと2回膨らむアニメを付与。
- StateAction: `src/domain/entities/Action/StateAction.ts` を新設し、BadState のカード挙動を集約。
  - PureBodyRelic 周りのコスト軽減を Card.ts から移譲。
  - 酩酊(Intoxication): 「記憶」タグを持つ全カード（状態カード含む）使用時に magnitude 分コスト増を cost() で反映。

## 実装ステップ
1. 型・基底整理
   - State に `getCategory()` / `isImportant?`（Traitのみ）を追加。
   - Snapshot 型に category/isImportant を追加。
2. StateAction 追加
   - BadState の共通コスト計算（PureBodyRelic/酩酊対応）を実装。
   - 既存 BadState を StateAction 継承に差し替え。
   - 各 BadState ファイル内に StateAction 定義（BadState向け）を同居させ、Stateから直接参照できるようにする。
3. Buff/Trait からカード要素削除
   - cardDefinition/cost など不要プロパティを除去。
4. EnemyTeam ごとの重要 Trait 設定
   - SnailTeam: HardShell を isImportant=true
   - TestEnemyTeam: HardShell を isImportant=true
   - HummingbirdAlliesTeam: Flight を isImportant=true
   - IronBloomTeam: GuardianPetal を isImportant=true
   - OrcHeroEliteTeam: Large / FuryAwakening を isImportant=true
   - TestSlug5HpTeam: isImportant 指定なし
   - 他チームも追加可能な仕組みに。
5. Snapshot→UI 反映
   - BattleSnapshot生成で category/isImportant を埋める。
   - EnemyCard 表示ロジックをカテゴリ別に分け、Trait セクションに isImportant アニメを付与。
   - Snapshot用の State 型をカテゴリ別に定義し、Player/Enemy 共通の共用体で扱う（BadStateSnapshot/BuffStateSnapshot/TraitStateSnapshot）。
6. テスト/Fixture
   - 型変更に伴う Fixture 更新。
   - コスト計算（酩酊・PureBody）周りのユニット/既存テスト調整。

## 不明点・確認（更新版）
- Trait以外の並び順・件数上限: 不要（現状の順序でOK）。
- 酩酊の適用範囲: 「記憶」タグを持つ全カード（状態カード含む）にコスト増を適用。
- BattleSnapshot で使う State 型は Bad/Buff/Trait の3種を用意し、プレイヤー/敵で共通利用する。

この方針で実装を進めます。***
