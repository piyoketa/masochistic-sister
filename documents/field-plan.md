# フィールド導入・FieldView 実装計画（初稿）

## 目的
- フィールド（マップ）概念を追加し、戦闘前の進行画面を提供する。
- FieldView が Field モデルを受け取り、現在地・進行可能マスを UI で選択できるようにする。
- サンプルとして一直線の SampleField を実装し、敵マスを通過しながら戦闘へ遷移する流れを作る。

## 仕様整理
- Field: レベル単位でマス（Node）を管理。プレイヤーは現在レベルの次のレベルに存在し、かつ現在地から接続しているマスのみ選択可能。
- マス種別（今回実装）:
  - StartNode: プロパティなし。
  - EnemyNode: EnemyTeam を1つ保持。選択時に `/battle/<teamId>` へ遷移。
- SampleField:
  - Level1: StartNode
  - Level2: EnemyNode(snail)
  - Level3: EnemyNode(iron-bloom)
  - Level4: EnemyNode(hummingbird-scorpion)
  - Level5: EnemyNode(orc-hero-elite)
- Store: 現在地とクリア状態を保持。戦闘勝利後、現在地をクリア扱いにして次レベル解放。フィールド画面へ戻る。
- FieldView: リスト表示で簡易に可視化し、進行可能マスのみ選択可能。ヘッダーに HP・デッキ枚数などを表示。

## 実装タスク案
1) ドメインモデル
   - `src/fields/domains/Field.ts` (抽象): levels, nodes, currentLevel, reachableNodes(currentNode) などの API。
   - Node クラス群: `FieldNode` 基底、`StartNode`, `EnemyNode`（teamId/EnemyTeam）。
   - SampleField 実装（一直線、レベルごとのノード配列と接続情報）。
2) ストア
   - `useFieldStore`（Pinia）新規: 現在 Field インスタンス、現在レベル/ノード index、クリアフラグを保持。進行可否判定・ノード選択を提供。
   - 戦闘終了フック: 勝利時に `markCleared` → `advanceToNextLevel`。敗北時は進行なし。
3) ルーティング
   - `FieldView.vue` を `/field` などのパスで追加。TitleView からリンクを設置。
4) View
   - FieldView: ヘッダーに HP/MaxHP、デッキ枚数を表示。現在レベル/次レベルを一覧表示し、進行可能マスにのみ「進む」ボタン（EnemyNode は `/battle/:teamId` に遷移）。
   - シンプルなリスト UI で開始（後日グラフ表示に拡張可）。
5) データ連携
   - FieldStore → FieldView に注入。BattleView 終了後の遷移（勝利時に FieldView へ戻る）を設定。

## 不明点・確認事項
- BattleView 終了後の「報酬獲得」処理との連携方法（イベントのフック位置）。→ 現状は勝利後に直接 FieldView へ遷移する想定で良いか？
  -> 勝利後に直接 FieldView へ遷移する想定でOKです。
- Field インスタンスの初期化タイミング: アプリ起動時に毎回リセットでよいか、それとも永続化が必要か？
　-> 現状は、アプリ起動時に毎回リセットで構いません。将来的に永続化方法を考えます。
- 敗北時の遷移先: FieldView に戻るのか、タイトルへ戻すのか？
  -> 現状では考えなくてOKです。

## 次のステップ
- 上記不明点について方針確認後、ドメインクラス・ストア・FieldView の追加実装に着手。
