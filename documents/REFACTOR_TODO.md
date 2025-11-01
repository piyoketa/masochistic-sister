# 戦闘ロジック リファクタTODO一覧

| 優先度 | 状態 | 項目 | 内容 |
| --- | --- | --- | --- |
| 高 | ✅ 完了 | `Action` / `Operation` 周辺の共通化 | `Action.prepareContext` の操作処理をヘルパー化し、ターゲット判定や `Operation` 完了チェックを共通化。`isPlayer` 判定も型ガードにまとめて各所の記述を削減済み。 |
| 高 | ⏳ 未着手 | 敵行動キュー管理の整理 | `Enemy.queueImmediateAction` や `discardNextScheduledAction` が手続き的に散っている。行動リストをラッパークラス化し、`enqueue/prepend/consume` を一貫させてバグを防ぎやすくする。 |
| 中 | ⏳ 未着手 | イベント処理ディスパッチ化 | `Battle.resolveEvents` → `applyEvent` が type 判定で増殖する恐れ。イベント種別ごとにハンドラ関数を登録できるディスパッチテーブルにして、イベント追加時の修正範囲を限定する。 |
| 中 | ⏳ 未着手 | デッキ再編成ロジックの抽出 | `Battle.reloadDeckFromDiscard` が Acid 専用の並び替えを内包。`DeckReshuffler` のような戦術クラスへ抽出し、シャッフル戦略の切り替えを容易にする。 |
| 中 | ⏳ 未着手 | 記憶カード生成の再利用化 | `Attack.cloneWithDamages` や `CardRepository.buildMemoryOverrides` でダメージ値・テキスト生成が重複。`Damages` 側のファクトリや共通テンプレートを導入し DRY に保つ。 |
| 低 | ⏳ 未着手 | テスト支援ユーティリティ整備 | `battleSampleScenario` 内でログ構築・再生・期待値取得が肥大化。専用ユーティリティを切り出し、統合テストの表現力と保守性を高める。 |
| 低 | ⏳ 未着手 | ターンマネジメント責務整理 | `Battle.applyActionLogEntry` がターンフェーズ切替処理を抱えている。`TurnManager` にプレイヤー開始時のリセットやイベント処理を委譲し、`Battle` の責務を縮小する。 |
| 低 | ⏳ 未着手 | ログ／リプレイヤーの拡張性向上 | `ActionLogReplayer.resolvePlayCardEntry` に ID 変換ロジックが散在。共通の解決ヘルパーと `ResolvedBattleActionLogEntry` のサブタイプ化で可読性を上げる。 |
