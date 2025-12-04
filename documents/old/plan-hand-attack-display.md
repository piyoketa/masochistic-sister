# 手札攻撃カードのダメージ表示タイミング見直し 計画

## 背景・目的
- 現状: 手札表示中から常にプレイヤーState補正を盛り込み、TargetEnemyOperationの敵フォーカス時に敵State補正をさらに加算している。
- 変更要求: 手札表示中は補正なし。TargetEnemyOperation開始時（敵未フォーカス）にプレイヤーStateを反映し、敵フォーカスで敵Stateも加算する段階的表示へ変更する。

## 影響範囲の想定
- `useHandPresentation`（BattleHandAreaのCardInfo構築）でのダメージ/説明生成ロジック。
- `HandEntry`の選択状態や`isAwaitingEnemy`フラグの扱い（敵選択待ち判定）。
- カード説明のダメージ文言（describeForPlayerCardで渡すdisplayDamages）。
- 必要ならActionCardの強調表示（damageAmountBoosted/Reducedフラグ）への影響確認。

## 変更方針
- 手札常時表示: baseダメージをそのまま表示（補正0）。
- 敵選択待ちに入った瞬間: プレイヤーStateのみ適用した表示へ切り替え。
- 敵をフォーカスしたとき: プレイヤーState＋その敵のStateを適用した表示へ更新。
- 条件判定は操作状態ベースで行い、攻撃回数や`DamagePattern`による判定は禁止（ゲーム全体ルール）。

## 実装ステップ案
1. 現行処理の整理  
   - `useHandPresentation`でどの条件下で`Damages`を再計算しているかを確認（selectedCardKey/hoveredEnemyIdなど）。  
   - `isAwaitingEnemy`の立ち上がり/リセットタイミングを`useHandInteraction`側で再確認。
2. 表示ロジックの切り分け  
   - 手札通常時: baseDamagesをそのまま表示。  
   - 敵選択待ち（カード選択済み・isAwaitingEnemy=true か相当）: playerStatesのみ渡して`Damages`計算。  
   - 敵フォーカス時: 上記に加えて対象敵Statesを渡して再計算。  
   - descriptionSegmentsもdisplayDamagesに合わせて更新する。
3. 状態遷移と表示更新の確認  
   - 敵選択開始→キャンセル時に表示が元のbase表示へ戻ることを確認する。  
   - hover対象が変わるたびに敵State反映が切り替わることを確認する。
4. リファクタリング/不要コード確認  
   - 旧仕様前提でのブーストフラグや計算が不要になっていないか確認し、簡素化できる部分があれば整理する。
5. ドキュメント/コメント整備  
   - 挙動が変わる箇所に簡潔な意図コメントを追加。必要ならSTATE関連資料は不要（表示のみの変更のため）。

## テスト計画
- 単体/UIロジック: `useHandPresentation`周辺のユニットテストを追加し、  
  - 通常時: baseダメージ表示。  
  - 選択待ち: playerState適用。  
  - 敵フォーカス: player+enemyState適用。  
  - キャンセル後にbaseへ戻る。  
- 既存表示のスナップショット系テストがあれば更新確認。  
- 手動確認: 実際にカード選択→敵ホバーでダメージ表記が段階的に変わることを目視。

## 不明点と選択肢
1. 敵選択を要求しない攻撃（現状ほぼ無し）への適用  
   - A: 全攻撃がTargetEnemyOperation前提なので考慮不要。  
   - B: 将来の自動ターゲット攻撃を想定し、isAwaitingEnemy以外のトリガーも設ける。  
   - おすすめ: A（現仕様に合わせてシンプルにする）。  
2. プレイヤーState適用のタイミング判定  
   - A: `isAwaitingEnemy`フラグをトリガーにする。  
   - B: `selectedCardKey`のみで判定する。  
   - おすすめ: A（要件に「TargetEnemyOperation開始時」と明記があるため、待ち状態を起点にする）。  
3. 表示ブースト/減少の強調フラグ更新  
   - A: 新ロジックに合わせて再計算された値でブースト判定を行う。  
   - B: ブースト強調をオフにする。  
   - おすすめ: A（UI情報として有用なため維持）。
