## BattleActionLogEntry 再設計計画

### 1. ゴールと背景
- 敵ターン演出や手札移動アニメーションを ActionLog ベースで再生できるようにするため、`BattleActionLogEntry` の粒度を細分化し、各エントリに `AnimationInstruction[]` を持たせる。
- 既存の `end-player-turn` エントリに敵行動をまとめて記録している構造では、敵ごとのアニメーションや副次的イベント（臆病による逃走など）を順序立てて再現できない。
- 将来的な `victory` / `gameover` エントリ追加にも対応できる拡張性を確保する。

### 2. 新しい Entry タイプと責務
| type | 役割 | 代表的な animations |
| --- | --- | --- |
| `battle-start` | 初期盤面の提示。プレセット読み込み直後の状態を snapshot 化。 | 初期描画のみ |
| `start-player-turn` | ドローとマナリセットのみを記録。開始時イベントは含めない。 | ドロー演出 |
| `player-event` | 「戦いの準備」などターン開始イベントで発生する効果を記録。 | マナ＋1 などのステータス更新 |
| `play-card` | プレイヤーがカードを使用した操作ログ。敵の即時行動は含まない。 | 手札移動、効果適用 |
| `enemy-act` ⭐ | 敵 1 体が行動した事実を記録する。通常ターン・被虐のオーラ等すべて統一。 | 敵ハイライト、ダメージ、状態変化 |
| `state-event` | 状態異常の tick など、プレイヤー/敵いずれかの State が自動で発動するイベントを記録。 | 毒ダメージ、臆病逃走、守りの花びらなど |
| `end-player-turn` | プレイヤーがターンを終了した事実のみを記録。敵行動は含まない。 | ボタン押下演出など |
| `victory` / `gameover` | 戦闘結果を示す。 | リザルトオーバーレイ |

補足:
- `enemy-act` は敵 AI が 1 回行動するごとに 1 エントリ生成。`MasochisticAuraAction` 等で敵行動を強制する場合もこのタイプを追加する。
- 「臆病」や毒ダメージなどの State 発動は `state-event`、戦いの準備などプレイヤー開始イベントは `player-event` として独立させ、メイン行動と混在させない。

### 3. AnimationInstruction とスナップショット
```ts
type AnimationInstruction = {
  patch: BattleSnapshotPatch   // 差分適用する領域を限定
  waitMs: number               // 次 instruction までの待ち時間
  damageOutcomes?: DamageOutcome[]
  metadata?: Record<string, unknown>
}
```
- 各 entry は 1 つ以上の instruction を持ち、DOM 更新タイミングを明示。
- `patch` には hand / deck / discard / player / enemies / overlays など、更新が必要なセクションのみ含める。これにより計算量を制御。
- AttackAction が生成した `DamageOutcome[]` は instruction 生成時に複製して保持し、再計算を防ぐ。

### 4. ドメイン側で必要な改修
1. **ActionLog 型の更新**  
   - `BattleActionLogEntry` の union を上記タイプに合わせる。  
   - すべてのエントリに `animations: AnimationInstruction[]` を必須フィールドとして追加。  
   - `BattleActionLog`, `ActionLogReplayer`, `ViewManager` など、エントリ構造を参照する箇所を一括更新。
2. **Battle 実装の変更**  
   - プレイヤーターン終了時の敵行動ループを、敵ごとに `enemy-act` エントリを積む方式へ変更。  
   - カード効果で敵を行動させる際も `play-card` → `enemy-act` の 2 ステップでログ化。  
   - 毒・臆病・守りの花びらなどの State 処理は `state-event`、戦いの準備などは `player-event` として ActionLog に追加する。  
   - `AnimationInstruction` を生成するユーティリティを実装し、手札移動／ダメージ／撃破などのパターンを共通化。
3. **Snapshot Patch 生成**  
   - Battle 内に `createSnapshotPatch({ hand?, deck?, ... })` のようなメソッドを追加し、アニメーション単位で差分を構築。  
   - `play-card` の例:  
     - instruct[0]: 手札→捨て札移動 patch、wait 0ms  
     - instruct[1]: ダメージ適用 patch + `damageOutcomes`、wait 600ms  
     - instruct[2]: 敵撃破 patch、wait 1000ms

### 5. 既存シナリオ・テストへの影響
- **Integration テスト (`battleSample.spec.ts`, `battleSample2.spec.ts`)**  
  - ログ検証を「entry タイプ + animation シーケンス」単位で見直す。  
  - 敵行動を `enemy-act` として複数 entry に分割するため、期待ログの数・順番が大幅に変わる。  
  - 臆病/逃走、日課によるマナ追加などの副次イベントも独立 entry として Assert する。
- **ActionLogReplayer / ViewManager テスト**  
  - `animations` を逐次再生するロジックを検証するユニットテストを追加。  
  - スキップ・高速化時の `waitMs` 処理をモックタイマーで確認。
- **State / Action テスト**  
  - `MasochisticAuraAction` や `TailwindAction` が `enemy-act` entry を生成するかを確認するカバレッジを追加。  
  - `cowardAndBleed` などの state テストで、新しいイベント粒度に適合させる。

### 6. 実装手順案
1. **型の拡張**: `AnimationInstruction`, `BattleSnapshotPatch`, `BattleActionLogEntry` 更新。型崩れをエディタで一括修正。  
2. **BattleActionLog / Replayer 更新**: `animations` を必須にし、再生 API を調整。  
3. **Battle ロジック改修**: 敵ターン処理とカード由来の敵行動を `enemy-act` へ分割。副次イベントも個別 entry 化。  
4. **AnimationInstruction 生成ユーティリティ**: 手札移動／DamageOutcome／撃破／逃走などのテンプレートを用意し、Battle から呼び出す。  
5. **Integration テスト書き換え**: シナリオ 1/2 と新規テスト用 fixture を `enemy-act` 形式で再記述。  
6. **View 側調整 & 目視確認**: 新フォーマットで ActionLog を再生できるようにしてから、ステージ 1/2 を手動確認。  
7. **ドキュメント更新**: `documents/BATTLE_SAMPLE*.md` に entry 粒度の変更点を追記。

### 7. 懸念点 / 未決事項
1. **SnapshotPatch の構造**: どのセクションを細分化するか（hand/enemies/player/events など）を先に設計する必要がある。  
2. **副次イベントの type**: 逃走・マナ加算などを `enemy-act` で一括管理するか、`system-event` を新設するか要検討。  
3. **過去ログ互換性**: 旧フォーマットのログが存在する場合の互換対応。デモ用途なら破壊的変更を許容するか判断が必要。  
4. **パフォーマンス**: instruction ごとに patch を組む処理負荷。キャッシュや再利用の検討。  
5. **View 実装順**: ドメイン側だけ先行で変更すると UI が再生不能になるため、feature フラグや段階的マージ方針を決める。

### 8. 作成すべきテストケース（抜粋）
1. **`play-card` → `enemy-act` 連鎖**: 被虐のオーラ使用後、指定敵が行動するまでを entry 単位で検証。  
2. **敵ターン処理**: `end-player-turn` → 複数 `enemy-act` の順序が行動順ロジックと一致するか。  
3. **臆病トリガー**: オーク撃破 → かたつむり逃走(`state-event`) → victory のログ連鎖。  
4. **マナイベント**: 「戦いの準備」などターン開始イベントが `player-event` entry として記録され、マナ＋1 instruction を含むか。  
5. **DamageOutcome と AnimationInstruction の分離**: `DamageOutcome[]` を書き換えても instruction 内の値が変化しないこと。  
6. **View 再生テスト**: `animations` を順次再生し、最後の snapshot と待機時間計算が期待通りになるか（モックタイマー使用）。

この計画に沿って ActionLog 周りを段階的に改修し、アニメーション仕様書（`documents/enemy_turn_animation.md`）と整合させる。
