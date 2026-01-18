# アクティブレリック表示のバックエンド連携計画

## 目的
BattleHandArea 上部に配置したアクティブレリック一覧を、バックエンドから取得した実データで描画できるようにする。既存の RelicList と同等の判定ロジック（uiState / usable / usesRemaining など）を前提に、MVV の通信制約を破らない形で View へ反映する。

## 前提と制約
- Model → View の伝達は ActionLogEntry + AnimationInstruction を基本とし、View は BattleSnapshot を通じて必要情報を取得する。
- View → Model は OperationLogEntry 経由でのみ操作を渡す。
- 既存の RelicList と同等の UI 状態判定（active/passive/field/disabled/processing）を踏襲する。

## 実装方針（案）
1. バックエンドから「戦闘中のレリック状態」を取得できる API を用意し、Battle 初期化時にスナップショットへ組み込む。
2. BattleSnapshot に「アクティブレリック表示用のデータ（RelicDisplayEntry 相当）」を含めるか、ドメイン側の Relic を View 側で map する。
3. ViewManager でスナップショット変化に合わせて UI 状態（active-ready / disabled / processing）を解決し、BattleActiveRelicList に props で渡す。
4. BattleActiveRelicList は表示専用として、クリック時は親（BattleView）へ emit → OperationLogEntry 発行の流れに寄せる。

## 具体的な作業ステップ
1. **データ契約の確定**
   - バックエンドで返すレリックの基本情報（id/name/icon/usageType/usesRemaining/usable/active 等）を定義する。
   - 既存の `RelicDisplayEntry` / `RelicUiState` とどこまで一致させるか決める。

2. **Model / Snapshot の拡張**
   - BattleSnapshot にアクティブレリックの状態を持たせる。
   - 既存の `mapSnapshotRelics` と整合する形でデータを格納する。

3. **ViewManager でのマッピング**
   - `RelicDisplayEntry` へ変換するユーティリティを整備する（既存の `mapSnapshotRelics` を再利用/拡張）。
   - 「処理中」状態（play-relic 等の ActionLogEntry）を反映できるようにする。

4. **BattleView での props 連携**
   - `BattleActiveRelicList` へ `disabled` / `usesRemaining` だけでなく、実際のリストを渡せるように拡張する。
   - クリック時は OperationLogEntry を通じて `play-relic` を送る。

5. **表示コンポーネントの拡張**
   - `BattleActiveRelicList` を固定DOMから `activeRelics` の配列描画に変更する。
   - `RelicList` と同等の UI 判定（hover / disabled / ready / processing）を流用する。

6. **テスト/確認**
   - 既存のバトルスナップショットを使って UI が崩れないか確認する。
   - usesRemaining の表示が「あとN回」で正しく出ることを確認する。

## 不明点リスト（回答反映済み）
1. **バックエンドの返却形式**
   - 選択肢A: `RelicDisplayEntry` と同じ構造で返す
   - 選択肢B: ドメインの `Relic` 構造で返し、View 側で map する
   - 決定: **B**（ドメイン主導で管理し、View 側で表示責務を分離できる）

2. **スナップショットへの持たせ方**
   - 選択肢A: `BattleSnapshot.player.relics` を拡張し、active/passive/field をまとめる
   - 選択肢B: `BattleSnapshot.player.activeRelics` を新設し、アクティブのみ分離する
   - 決定: **A**（既存の `mapSnapshotRelics` を活用できる）

3. **アクティブレリックの発動リクエスト経路**
   - 選択肢A: `BattleActiveRelicList` から `BattleView` へ emit → OperationLogEntry
   - 選択肢B: `BattleActiveRelicList` から直接 ViewManager を呼ぶ
   - 決定: **A**（View → Model 通信制約に合致）

4. **処理中（active-processing）の判定元**
   - 選択肢A: ActionLogEntry の `play-relic` を ViewManager が検出
   - 選択肢B: バックエンドが `processing` フラグを返す
   - 決定: **A**（ActionLog/AnimationInstruction で一貫）

## 依頼事項
上記の決定内容で問題ないかご確認ください。この計画書へのレビューをいただけ次第、実装に進みます。
