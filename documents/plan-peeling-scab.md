## スキルカード「剥がれた瘡蓋」実装計画

### 目的
- 新スキル「剥がれた瘡蓋」を追加し、山札から「ダメージ5のアタック」を1枚選んで手札に加えられるようにする。
- 山札/捨て札など手札外のカード選択を扱う新 Operation `selectPileCard` と、それに対応する選択 UI（PileChoiceOverlay）を整備する。
- 選択後の手札移動は既存の deck-draw 演出で統一する。

### 現行仕様との整合ポイント
- Operation は `Action` 側で定義され、UI は OperationLogEntry を介さず入力収集する。現状は `select-hand-card` / `target-enemy` のみサポート。
- PileOverlay は閲覧専用で、選択操作は提供していない。z-index は 40。
- deck-draw 演出は `stage: 'deck-draw'` を前提に、手札差分検知と `useHandStageEvents` で Materialize を再生する。

### 対応方針（推奨）
1. **Operation定義**: `SelectPileCardOperation` を新設（type: `select-pile-card`）。`payload` は `{ cardId }` のみ受け付け、resolve 時に deck/discard からカード実体を検索する。metadata には `selectedPileCardId` を格納。UI には「選択可能な候補のみ」を渡す前提とし、非選択理由の説明は不要とする（デバッグ用の理由出力も省略）。
2. **Action実装（剥がれた瘡蓋）**:  
   - コスト1の Skill。発動条件: 山札に「ダメージ5のアタック」カードが1枚以上。条件を満たさなければ play 不可扱いにする（isAvailable 相当の実装要）。  
   - operations: `select-pile-card` を1件。フィルターは「山札にある damage amount=5 の攻撃カード」。  
   - perform: 選択カードを山札から取り除き `Battle.drawSpecificCard` に相当するメソッド（存在しなければ新設）で手札へ移動させ、AnimationEvent に deck-draw を積む。
3. **候補判定の基準**: カードの DamagePattern を参照し、`pattern.amount === 5` かつ `cardDefinition.cardType === 'attack'` を満たすものを候補にする。`count` や状態異常による回数変動で判定しない（カテゴリ判定は DamagePattern の type を厳守）。
4. **PileChoiceOverlay**:  
   - PileOverlay の上に表示される選択オーバーレイ（z-index > 40）。  
   - props で候補 `CardInfo[]` とメッセージ、キャンセル/決定イベントを受け取る。CardList を `selectable=true` で表示し、クリックで `select` を emit。  
5. **UI統合**:  
   - `useHandInteraction` 相当の入力経路に `select-pile-card` を追加。OperationContext で `describePileSelectionAvailability`（Action 側提供）を呼び、PileChoiceOverlay を開く。  
   - 入力ロックやターン外は既存のハンドリングに準拠（右クリックでキャンセルできる）。オーバーレイ表示/非表示イベントを BattleView 経由で制御する。
6. **アニメーション**: 選択後の移動は `Battle.recordDrawAnimationEvents` など既存デッキドロー経路を利用し、`stage: 'deck-draw'` を発火させる。追加のカード移動ステージは増やさない。
7. **テスト方針**:  
   - Action 単体: 山札に候補あり/なし、選択不正ケース（別カードID）でエラーになること。  
   - Operation: availability で候補フィルタが効くこと。  
   - 簡易統合: 選択→deck-draw stage が ActionLog に出力されること（フィクスチャ再生成）。

### タスク一覧
1. ドメイン調査: Attackカードのダメージ定義場所（DamagePattern参照方法）、山札から特定カードを抜き出しつつ draw アニメを積むメソッド有無を確認。
2. Operation: `SelectPileCardOperation` 実装と `operations/index` エクスポート、availability API 追加。
3. Action: `剥がれた瘡蓋` クラス新規作成。isAvailable / operations / perform を実装し、Library への登録とカードデータ（タグ等）の決定。
4. View入力: `useHandInteraction` 相当ロジックに `select-pile-card` 分岐を追加し、PileChoiceOverlay を開くための状態・イベントを BattleView へ伝搬。
5. UI: `PileChoiceOverlay` コンポーネントと専用ストア（必要なら）を新設。選択/キャンセルイベントと不可理由表示、z-index 調整。
6. アニメーション連携: 選択カードを deck-draw stage で出すための Battle 側イベント積み込みを確認/追加し、手札差分ウォッチが動くことを確認。
7. テスト/フィクスチャ: 単体テスト追加、`scripts/updateActionLogFixtures.mjs` の調整（必要なら）、既存シナリオへの影響確認。

### 不明点と選択肢（推奨を採用予定）
1. **「ダメージ5のアタック」の判定方法**  
   - A) DamagePattern.amount === 5 の攻撃カードのみ対象（推奨）  
   - B) baseDamage.amount === 5 かつ count 任意  
   - C) 実効ダメージ5になるバフ考慮  
   → **推奨: A** シンプルにカード定義の基礎値で判定する。
2. **候補が複数ある場合の順序**  
   - A) 山札上から順に列挙（推奨）  
   - B) ソートせず ID 順  
   - C) ランダム  
   → C ランダム
3. **キャンセル時の挙動**  
   - A) プレイ自体をエラーにしてキャンセル（推奨）  
   - B) 自動で最上段を選択  
   - C) プレイを不発扱いでマナ返却  
   → **推奨: A** 現行の select-hand-card と同等の扱い。
