# 回答のルール
- javascript classやVue.jsのコンポーネントファイルを作成する場合は、以下の内容を含む解説ドキュメントを日本語で作成し、ファイルの頭部分にコメントとして記載してください。
  - そのComponentの責務と、逆にそのComponentで責務ではないことは何か
  - そのComponentが通信する主な相手と、その相手とのインターフェースとなるメソッド。やり取りする情報（型）の解説。もし、類似する型があれば、それとどう異なるか。
- 全ての回答は日本語で作成してください。
- テストを作成する場合、テスト名は日本語で説明しなさい。
- コードの意図は詳しめにコメントを残すようにしてください。
- integrationテストを書く場合は、それぞれの指示が具体的などのような操作／アニメーションに相当するのか、日本語でコメントを残すようにしてください。
- 設計上の重要な意思決定は、コード中にもコメントで書き込むようにしてください。
- 指示内容や既存テスト仕様に矛盾・不明点がある場合は、独断で進めず必ず人間に確認を取ってください。状況を説明し、判断を仰いでから実装を続行します。
- 仕様の不明点があれば、一覧にまとめ、あなたの考える選択肢とその中のおすすめを教えてください。

# このレポジトリの説明
このレポジトリは、オリジナルのローグライクカードゲームの戦闘シーンの実験を行うためのデモVue3アプリのレポジトリです。
Slay The Spireのようなローグライクカードゲームを一から作るため、カードやルールなどを柔軟に変更しながら、こまめに戦闘を行い、ゲーム性がちゃんと担保されているか、ハラハラする戦闘になっているかどうかを実験できる環境を作ります。

## テーマ
敵の攻撃の「記憶」をデッキにして戦え！
被虐系ローグライクカードバトル

- 基本的にはslay the spireや、inscryptionのような、マップ + カード戦闘のローグライクゲーム
- プレイヤーは"記憶"の聖女であり、身体に残る「傷」の記憶を再生できる力を持つので、敵の攻撃を受けると、その時に受けたダメージが「カード」としてデッキに登録される

## MVV設計と通信制約
### 基本方針と主要オブジェクト
- **Model**: `Battle` / `OperationRunner` / ドメインエンティティ。戦闘ルールと状態遷移を司る。
- **ViewModel**: `ViewManager`。ActionLog / AnimationInstruction を管理し、View が扱いやすい状態 (`BattleViewState`) を提供する。
- **View**: `BattleView` / 各 Vue コンポーネント。ViewModel から渡された情報を描画し、ユーザー操作を OperationLogEntry としてキューイングする。

### Model → View 方向の通信
- Payload は **ActionLogEntry + AnimationInstruction** のみを原則とする。
  - **ActionLogEntry**: `type`, `operations`, `postEntrySnapshot` (BattleSnapshot) などを持つエントリ。例: `{ type: 'play-card', operations: [...], postEntrySnapshot: {...} }`
  - **AnimationInstruction**: `stage`, `batchId`, `waitMs`, `snapshot`, `metadata` を持ち、View に「どの演出を、どの順番で、どのスナップショットで再生するか」を伝える。例: `{ stage: 'enemy-highlight', waitMs: 0, snapshot: {...}, metadata: { enemyId: 2 } }`
- **理由**:
  - ActionLog と AnimationInstruction を唯一の境界情報にすることで、ログ再生・巻き戻し・デバッグを同一フォーマットで行える。
  - Model の内部状態を直接 View に晒さず、常に「アニメーション再生時点の凍結データ」を渡すため、表示の一貫性と決定性が保たれる。
  - 伝達経路を限定することで、Model と View の依存が循環せず、将来的な差分再生・リプレイ・サーバ同期がやりやすい。

### View → Model 方向の通信
- Payload は **OperationLogEntry**（`{ type: 'play-card', card: id, operations: [...] }`, `{ type: 'end-player-turn' }` など）に限定する。
  - `BattleView` はユーザー操作を `ViewManager.queuePlayerAction` に渡し、ViewManager が OperationLogEntry を生成して OperationRunner へ渡す。
- **理由**:
  - すべてのプレイヤー操作を OperationLog に記録し、Model 側では「OperationLog を順に適用する」だけで戦闘を再現できるようにするため。
  - View から Model の内部 API を直接呼ぶとログと実挙動が乖離し、巻き戻しや再生の整合が取れなくなるため。
- **例外（直接参照を許容するケース）**:
  - 完全に表示専用であり、Battle の状態を変更しない。
  - アニメーション再生が完了し、次のプレイヤー入力待ちフェーズである（例: メインフェイズのカード選択時）。
  - これらの条件を満たす場合のみ、View から Model への読み取り問い合わせ（例: ツールチップ用の静的情報取得）を許容する。それ以外は OperationLogEntry / ActionLogEntry 経由に統一する。
