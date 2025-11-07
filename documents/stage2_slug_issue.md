# Stage2: なめくじ逃走時の処理停止調査メモ

## 1. 現象
- 対象プリセット: `stage2`（鉄花チーム、デッキは `buildDefaultDeck2`）。
- 他の敵（オークランサー／かまいたち／鉄花）を撃破し、なめくじ（CowardTrait 持ち）のみが残った状態でターンを進める。
- 期待挙動: CowardTrait により、最後に残ったなめくじは逃走し、その瞬間に Victory 判定・勝利演出が表示される。
- 実際の挙動:
  - Battle ドメイン側では `Enemy.flee` → `Battle.recordOutcome('victory')` が発火しており、ログにも「逃走した」旨が出力される。
  - しかし `BattleView` 上では敵が全滅した扱いにならず、「処理中」状態から復帰せず Victory オーバーレイも表示されない。
  - プレイヤーは再試行以外の操作ができず、実質的に進行不能となる。

## 2. 原因
- `BattleView` の Victory 判定ロジックが敵 HP のみを参照している（`src/views/BattleView.vue:128` 付近）。
  ```ts
  const survivingEnemies = enemyList.filter((enemy) => enemy.currentHp > 0)
  return survivingEnemies.length === 0
  ```
- 逃走した敵 (`EnemyStatus === 'escaped'`) も HP は減少していないため `currentHp > 0` を満たし続け、`survivingEnemies.length` が 1 以上のままになる。
- Battle の `status` フィールドはすでに `'victory'` に更新されているが、ビューはこのフィールドを参照していないため、勝利演出が発火しない。
- 結果として UI では「敵がまだ生存している」と判定され、Victory オーバーレイが出ず処理が継続中のように見えてしまう。

## 3. 改善方針（設計案）
1. Victory 判定をドメインの状態と同期させる  
   - `Battle` スナップショットの `status` を信頼し、`snapshot.status === 'victory'` を最優先で参照する。
   - 併せて、敵リストを走査する場合は `enemy.status === 'active'` かどうかでフィルタするよう修正する。

2. UI 表示の一貫性を確保  
   - `EnemyCard` 側でも `status` を表示（例: 逃走済みの場合はグレーアウト）し、プレイヤーへ正しい状態が伝わるようにする。
- Victory 発生時には入力ロック解除と結果オーバーレイ表示を確実に行い、リトライ／タイトルへ戻る動線を有効化する。

3. 将来的なテスト強化  
   - `tests/domain/battle/presets.spec.ts` や統合テストに、逃走 → Victory のケースを追加し、UI 判定と `Battle.status` が乖離しないことを自動検証する。
- View レベルでは e2e/コンポーネントテストで `snapshot.status` を与えて Victory オーバーレイが表示されることを確認する。

これらの改善により、CowardTrait など「HP が残ったまま戦線離脱する」ケースでも UI とドメイン状態が乖離せず、処理が停止したように見える問題を解消できる見込みです。

## 4. 実装状況
- BattleView の勝利／敗北判定は `snapshot.status` を参照するよう更新済み。
- EnemyCard 表示はステータスが `active` の敵のみ描画し、離脱済みスロットはスペーサーで保持することでレイアウトの乱れを防止。
- 今後は Victory 後の操作ロック解除や UI テストの追加を継続検討する。
