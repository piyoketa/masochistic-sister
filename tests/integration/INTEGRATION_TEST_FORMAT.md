# integrationテストメモ

## 1. 期待ActionLogフィクスチャの方針
- `tests/fixtures/battleSampleExpectedActionLog.ts` / `battleSample2ExpectedActionLog.ts` は、ActionLogEntryを **1エントリ＝1変数** で定義し、上部に「このエントリがゲーム上のどんな出来事か」を日本語コメントで記載します。
- `snapshot` は 1 行で表現し、末尾コメントで「HP / 手札 / 敵HP など、目視で確認したい点」をまとめます。
- `export const ACTION_LOG_ENTRY_SEQUENCE = [...]` には、定義済みエントリ変数を順番に並べるだけとし、人間が読むべき詳細は各エントリの定義側に集約します。

## 2. フィクスチャ再生成手順
1. まず、対象シナリオのIntegrationテストを `LOG_BATTLE_SAMPLE*_SUMMARY=1` で実行し、`/tmp/battleSample*.log` を生成します。
   ```bash
   LOG_BATTLE_SAMPLE1_SUMMARY=1 npx vitest tests/integration/battleSample.spec.ts > /tmp/battleSample1.log 2>&1
   LOG_BATTLE_SAMPLE2_SUMMARY=1 npx vitest tests/integration/battleSample2.spec.ts > /tmp/battleSample2.log 2>&1
   ```
2. 生成されたログを整形してフィクスチャを書き換えます。
   ```bash
   node scripts/updateActionLogFixtures.mjs
   ```
3. 差分を確認し、必要に応じてコメントを微調整したうえでコミットします。

## 3. テストコード側の書き方
- Integrationテストでは `tests/integration/utils/battleLogTestUtils.ts` の `summarizeActionLogEntry` で得られる構造を `ActionLogEntrySummary[]` として比較します。
- 期待値はフィクスチャの `ACTION_LOG_ENTRY_SEQUENCE` を展開した配列にし、テストごとに `slice` で比較する形を基本とします。
- 追加のOperationLogシナリオを作る場合は、**必ず人間が追跡しやすい日本語コメント** を付け、`snapshot` のコメントには「このテストで何を検証したいのか（HP/手札/敵HPなど）」を書いてください。

## 4. 注意事項
- 仕様が曖昧な場合や演出方針に矛盾を見つけた場合は、必ず人間に確認を仰ぎます（Agentルール）。
- `scripts/updateActionLogFixtures.mjs` は `/tmp/battleSample*.log` を前提にしているため、別名でログを残したい場合はスクリプトを編集してから実行してください。
