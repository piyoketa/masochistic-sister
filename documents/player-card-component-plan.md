# PlayerCardComponent 計画（HP同期・段階ダメージ演出・表情差分連動）

## 目的
- PlayerImage と HpGauge、DamageEffects を単一コンポーネント（PlayerCardComponent）で束ね、同じ HP 表示状態で同期させる。
- 連続ダメージ（例: 20ダメ×4回）の受傷時に、DamageEffects の演出と連動して HP バーを段階的に減少させ、差し替え画像や表情差分を演出タイミングに合わせて切り替える。

## 仕様整理
- 構成要素: PlayerImageComponent（本体画像＋表情差分）、HpGauge、DamageEffects をラップ。
- HP 表示: `displayHp` を PlayerCardComponent 内で管理し、HpGauge と PlayerImageComponent に同一値を渡す。`displayHp` の開始値は「ダメージ適用前の HP」を用いる。
- snapshot 更新順序への対応: アニメーションでは `update-snapshot` → `player-damage stage` の順で届くため、post-damage snapshot しか手に入らないケースがある。対策として:
  - BattleView で「前回の snapshot」を保持し、`update-snapshot` 適用前に preSnapshot を stash。
  - PlayerCardComponent へ `preHp`（preSnapshot.player.currentHp）と `postHp`（snapshot.player.currentHp）を両方渡す。
  - preSnapshot が無い場合は `postHp + sum(outcomes.damageAmount)` を計算して開始 HP を推定（maxHp でクリップ）。
- 段階ダメージの流れ（例: 150 → 130 → 110 → 90、各20ダメージが4回）:
  1. DamageEffects 再生開始と同時に `displayHp` を preHp にセットし、受傷中フラグを立てる。
  2. 各ヒット完了タイミングで `displayHp` を段階的に減少（130→110→90）。HPバーは CSS トランジションで滑らかに縮む。
  3. 各ステップの数値表示が消えるタイミングでそのステップのトランジションも完了扱いとし、PlayerImage のベース画像をその時点の HP フレームに差し替える。
  4. 最終ステップ完了後に受傷フラグを落とし、`displayHp` は postHp で安定させる。
- 画像差し替え:
  - PlayerImageComponent のベース画像をステップ完了毎に差し替え（150→130のアニメ完了後に130フレームへ、以降同様）。
  - ダメージ演出中は表情差分 `face_diffs/damaged.png` を最優先で重ね、完了後にテーマ差分（Arcane/Sacredなど）へ戻す。
- 表情差分の優先順位:
  - 受傷中: damaged を最優先。
  - 非受傷時: selectionTheme に応じた差分（Arcane/Sacred）を表示。

## データフロー/連携
- Props（親: BattleView → PlayerCardComponent）
  - `snapshotHp`: { current, max }（アニメーション前の最新値）
  - `playerDamageOutcomes`: DamageEffects 用 outcomes
  - `isSelectingEnemy`, `selectionTheme`（テーマ表情差分用）
- PlayerCardComponent 内部状態
  - `displayHp`（現在表示中の HP 値; DamageEffects の進行に合わせて減少）
  - `pendingDamageSteps`: outcomes から算出したステップ列
  - `isTakingDamage`: ダメージ演出中フラグ
  - `activeFaceDiff`: 表示中の表情差分（`damaged` 優先、なければテーマ）
- イベント連携
  - DamageEffects に「演出完了」/「ヒット単位の完了」コールバックを追加するか、既存の `play()` Promise をフックし、各ヒット終了で PlayerCardComponent がステップ進行をトリガーする。既存 API にない場合、子への ref から「ヒット完了イベント」を購読する仕組みを追加検討。
  - HP トランジション終了は CSS トランジションの `transitionend` を PlayerCardComponent 内で捕捉し、次フレーム切替タイミングに利用。

## 実装ステップ（案）
1. **コンポーネント統合**
   - `PlayerCardComponent`（新規）を作成し、PlayerImageComponent / HpGauge / DamageEffects を内包。BattleView からは PlayerCardComponent だけを扱う。
2. **HP 表示状態の管理**
   - `displayHp` state を用意し、`preHp` を開始値とする。`preHp` は BattleView から渡された preSnapshot 由来値を優先し、無ければ postHp＋ダメージ合計で推定。
   - DamageEffects の outcomes 入力で `pendingDamageSteps`（各ヒット分の減少値）を計算し、各ヒット完了時に `displayHp` を更新、HpGauge と PlayerImage に渡す。
3. **ダメージ進行の同期**
   - DamageEffects の演出に合わせて「ヒット終了」イベントを受け取れるよう、DamageEffects にコールバック/emit を追加するか、PlayerCardComponent 側で outcomes を順に処理しつつ `setTimeout` ベースで同等のタイミングを再現（可能なら前者を優先）。
   - HP バーは CSS トランジションで減少（現行 HpGauge の width transition を利用）。トランジション完了をフックし、その時点の HP フレームに PlayerImage を差し替える。
4. **表情差分の制御**
   - `activeFaceDiff` を computed で決定: 受傷中は `damaged.png`、それ以外はテーマに応じた差分（Arcane/Sacredなど）を PlayerImageComponent に渡す。PlayerImageComponent には任意の faceDiff src を受け取れる props を追加する。
5. **テスト/検証**
   - 単体: PlayerCardComponent に outcomes を与え、ステップごとに displayHp が減少し、トランジション完了後に画像が切り替わることを確認するユニットテストを追加（可能なら）。
   - 既存 BattleView.spec は PlayerCardComponent 統合後に必要に応じてスタブ更新。

## 未確定/要確認
- 既存の音声・背景演出（TargetEnemy 選択時の表情差分など）と衝突しないかの調整が必要。`faceDiffOverride` で damaged を最優先し、完了後テーマ差分に戻す実装で対応。
- pre/post HP の精度は BattleView 側の previousSnapshot stashing に依存。ロールバック時や特殊な snapshot 省略ケースに追加対応が必要かもしれない。
