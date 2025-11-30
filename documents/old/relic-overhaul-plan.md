# レリック管理刷新 計画

## 目的
- BattleView がハードコードしている `DEFAULT_PLAYER_RELICS` 依存をやめ、実際の所持レリック情報を Snapshot 経由で描画する。
- playerStore に所持レリック（クラス名リスト）を保持し、Library から表示用情報（表示名/種別/説明/アイコン）を取得できるようにする。
- BattleSnapshot にレリック一覧（クラス名＋有効/無効フラグ）を含め、View 側は snapshot → 表示用 dict に変換して表示する。
- フィールド画面でも共通コンポーネントでレリック一覧を確認できるようにする。

## 作業項目
- playerStore
  - 所持レリックのクラス名リストを状態として追加。初期レリックもここで定義。
  - 所持レリックの追加/削除 API を用意（最低限 set でも可）。
- レリック情報 Library
  - クラス名 → インスタンス生成関数 / 情報辞書を提供するモジュールを新設。
  - 返却情報: 表示名, 種別(passive/active), 説明文, アイコン（暫定は絵文字）。
  - BattleSnapshot から受け取るクラス名をキーに、View 用の表示データを取得できること。
- BattleSnapshot 拡張
  - `player.relics: { className: string; active: boolean }[]` を追加。
  - バトル初期化時に playerStore の所持リストから埋める。
  - 有効/無効フラグはドメイン側で計算（例: LightweightCombatRelic は手札に腐食があれば active=true）。まずはダミーで false/true を許容。
- 表示用変換モジュール
  - Snapshot の relics 配列を Library 情報に紐付けて View で使える形へ変換する専用ユーティリティを作成。
- コンポーネント
  - 共通レリック一覧表示コンポーネント（例: `RelicList`）。BattleView と FieldView で再利用。
  - BattleView: 既存 header のレリック表示を Snapshot ベース + RelicList へ置き換える。
  - FieldView: BattleView ヘッダを参考に、所持レリック一覧を表示。
- ルーティング/デモ
  - 既存のデモリンク・画面でレリック表示が壊れないよう調整。

## 不明点・要確認
- 有効/無効フラグの算出責務: BattleSnapshot 生成時に各レリックが自前で active 判定を返す (A を採用)。Relic に専用メソッドを追加し、現段階では全て true を返すモック実装にする。
- 初期所持レリック: 「記憶の聖女」のみを初期所持とする。
- Library の公開 API 形式: 情報辞書 + ファクトリ関数の両方を提供し、active 判定が必要な場合はファクトリも利用可能にする。

## 新たな確定事項
- レリックはデッキと同様、Battle 初期化時に playerStore の所持クラス名リストをコピーし、その情報を基に Battle を生成する。

## 進行手順（概略）
1. playerStore に `relics: string[]` を追加し、初期レリックをセットするメソッドを用意。
2. レリック Library モジュールを作成（クラス名→情報/ファクトリ）。`RelicInfo` 型定義。
3. BattleSnapshot に relics 配列を追加し、バトル初期化で playerStore の所持リストを取り込み、active フラグを埋める（暫定は false またはルールに沿って判定）。
4. 表示変換ユーティリティを作成し、Snapshot relics → View 用データを取得。
5. 共通 `RelicList` コンポーネントを作成（アイコン/表示名/説明/種別表示）。
6. BattleView ヘッダのレリック表示を `RelicList` + snapshot ベースに差し替え。
7. FieldView にレリック表示を追加（BattleView と同じコンポーネントを使用）。
8. 簡易動作確認（BattleView, FieldView でレリックが表示されること）。
