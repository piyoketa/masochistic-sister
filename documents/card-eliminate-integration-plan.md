# card-eliminate アニメーション導入計画

## 目的
- `/lab/card-eliminate` で完成した「消滅：砂化（短縮）」演出を、実戦のカード消滅演出（手札からの `card-eliminate` stage）へ適用する。
- 既存の `useHandAnimations.ts` / `BattleHandArea.animations.css` など、手札アニメーション層と整合する形で導入し、必要なデバッグ/UI の分岐を整理する。

## 実装手順
1. **現状調査**
   - `useHandStageEvents.ts` が card-eliminate イベントをどのようにエンキューしているか、既存のアニメーション種別を再確認。
   - `useHandAnimations.ts` の `playCardEliminateAnimation` 相当の処理が呼んでいる CSS クラス、DOM レイヤー、オーバーレイ生成パターンを把握する。

2. **アニメーション要素の共通化**
   - Lab で使用している `ash-overlay` / `.ash-card-container` の DOM 操作を composable 化する（例: `useAshEliminateEffect`）か、既存 hand animation のインフラへ移植し、CardList と実戦の DOM 差を吸収する。
   - 粒子生成ロジック（motionScale / durationScale / horizontalSpreadScale / particleColor）を util として切り出し、短縮版パラメータをデフォルトとして使用できるようにする。

3. **BattleHandArea への適用**
   - `useHandAnimations.ts` 内でカード DOM を取得後、カード DOM を一時的にラップするコンテナ（Lab と同等の構造）を作るか、既存の `.battle-hand__card` をそのままマスク対象にできるか検証し、マナコストなどが欠けないように CSS を調整する。
   - `card-eliminate` イベントで `ash-despawn` クラスを付与し、Lab 同様にオーバーレイ粒子を生成・クリーンアップする。

4. **スタイル統合**
   - `BattleHandArea.animations.css` に `.ash-card-container` 系のスタイルを反映し、ラボと本番で共通のトークン（`--ash-duration` など）を定義。
   - 粒子 CSS も `useHandAnimations.ts` のインジェクトではなく CSS で定義し、必要なら `Teleport` 等でオーバーレイをドキュメント body に配置する。

5. **動作確認・デバッグ**
   - `/battle/testcase1` や `battleSampleScenario` の card-eliminate ケースを確認し、粒子色や速度が Lab と一致するかを手動確認。
   - デバッグログの制御（`damage-effects` 同様、環境変数や prop）を導入する場合は、ここでスイッチを提供する。

6. **ラボの後処理**
   - Lab で重複する util / スタイルがある場合、共通ファイルを参照するように修正し、差分を最小化する。

## 不明点・決定事項リスト
| 項目 | 取りうる選択肢 | 推奨 |
| --- | --- | --- |
| **本番 DOM をどうラップするか** | (A) 手札カードを wrap する追加コンテナを都度生成（Lab 同様）<br>(B) 既存 `.battle-hand__card` を直接マスク対象にし、CSS を調整 | **A を推奨**: Lab との再利用性が高く、マナコストを確実に含められる。 |
| **粒子色の決め方** | (A) カードタイプ（attack/skill/status）で決め打ち<br>(B) `CardInfo` 由来のテーマカラー（ActionCard CSS 変数）を参照<br>(C) Model 側で metadata を付与 | **A を推奨**: card-eliminate はカード種類が限定され、View 側で完結できる。 |
| **デバッグログ** | (A) 常時ログ出力<br>(B) Lab 同様に prop/環境変数で制御 | **B を推奨**: 通常プレイでログを抑制し、デバッグ時のみ有効化。 |
| **短縮パターンのパラメータ管理** | (A) useHandAnimations 内で定数管理<br>短縮パターンのパラメータ管理 | **B を推奨**: Lab との整合維持がしやすい。 |

ご確認いただき、「この計画書で問題ない」旨をいただいてから実装に着手します。ご不明点や追加要件があればお知らせください。***
