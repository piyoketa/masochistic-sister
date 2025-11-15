---
title: 2025-11-15 テスト実行状況メモ
---

## 実行コマンド
- `npm run test`

## 結果
- `Missing script: "test"` が発生し、テストスクリプトが未定義のため実行できませんでした。
- `package.json` の `scripts` には `test:unit`（Vitest 実行）や `type-check` などは存在するものの、`test` エイリアスは未登録です。

## 追加実行（2025-11-15 近況）
- `npm run test:unit`（内部的には `vitest run`）をフル実行し、Unit / Integration を含む全テストが成功しました。
- ログ上では `BattleHandArea` 由来のデバッグ出力（`[BattleHandArea][card-create] ...`）が多数流れますが、コンソール出力のみで失敗要因ではありません。
- 失敗していた `tests/integration/battleSample2.spec.ts` などは、ActionLog フィクスチャと Battle モック更新によって解消済みです。

## 問題点と影響
1. **標準コマンド不備**  
   - チーム内で「`npm run test` を叩く」という指示が共有されている一方で、スクリプトが欠けているため、指示通りに動けません。  
   - CI 側でも `npm test` が前提になっているケースがあると失敗要因になります。

## 対応案
1. `package.json` に `{"test": "npm run test:unit"}` を追加し、最小限でも unit テストが走るようにする（推奨）。  
2. もし統合テストや追加タスクが必要なら、`test` を `run-p test:unit test:integration` のように拡張し、個別スクリプトを細分化する。  
3. ドキュメントにも「現状は `npm run test:unit` を使う」旨を記載し、スクリプト追加までの暫定運用を共有する。
