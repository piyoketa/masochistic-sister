# 大王なめくじ（仲間を呼ぶ）実装計画

## 現状の課題
- 敵追加の仕組みが存在しない  
  - `EnemyTeam`/`Battle` は初期メンバー固定前提。途中でメンバーを増やす API がない。  
  - ID採番、行動キュー初期化、勝敗判定の再評価が未整備。  
  - Snapshot/復元/AnimationInstruction が「敵増加」を扱っていない。
- ビュー/アニメーションの対応不足  
  - `EnemyCard` v-for は固定数前提。動的追加時のアニメーションやレイアウト更新が未定義。  
  - ViewManager の apply-patch で「敵が増える」ケースを想定していない。
- テスト & 期待値  
  - 追加された敵の Snapshot・ログ・ヒント表示などの期待値が未定義。

## 実装方針
1) ドメイン層に「敵追加」APIを整備  
   - `Battle`/`EnemyTeam` に `addEnemy(enemy: Enemy, options?)` を追加し、以下を行う:  
     - Repository経由で ID 採番、`members` に push。  
     - 行動キュー初期化（`DefaultEnemyActionQueue`）。  
     - Snapshot 差分用のフラグ/イベントを蓄積（後で AnimationInstruction に渡す）。  
     - 勝敗判定は「全員撃破」条件を再計算するようにする。  
   - Snapshot/復元: `BattleSnapshot` に「現在の敵一覧」をそのまま書き出す（既存構造で id/name/hp/states/... を含む）。復元時も追加分を生成できるようにする。
2) アニメーション/ビュー対応  
   - AnimationInstruction に `enemy-add` ステージ（例: `{ stage: 'enemy-add', metadata: { enemySnapshot } }`）を追加し、View 側で `EnemyCard` を新規挿入する演出を作る。  
   - `EnemyCard` v-for を ID ベースで動的増減に耐えさせる。  
   - State/nextActions 描画も増分反映するよう apply-patch を拡張。
3) スキル実装（仲間を呼ぶ）  
   - 新スキル `SummonAllyAction` (skill) を作成。発動時、敵数が5未満なら SnailEnemy を生成して `addEnemy` を呼ぶ。5体以上なら発動失敗/別行動。  
   - 大王なめくじ専用AI:  
     - 敵が5体未満 → `仲間を呼ぶ`  
     - 5体 → 突き刺す(10×4)  
   - 大王なめくじは HP100・大型 Trait を保持。  
   - チーム構成: 大王なめくじ + なめくじ×2 で開始。
4) フィールド/導線  
   - 新エリートチーム `giant-slug-elite` を追加。  
   - SampleField のエリート候補に追加し、ランダム選択に含める。  
   - TitleView にリンクを追加（任意）。
5) テスト  
   - ユニット: `addEnemy` の ID 採番・行動キュー初期化・ Snapshot 反映を検証。  
   - インテグレーション: 仲間を呼ぶ発動で EnemyCard が増え、ログ/ヒントが整合するか確認。  
   - 5体制限で発動しない（または別行動）ケースもテスト。

## 大王なめくじ専用アクションキュー
- 目的: 技の優先度リストを持ち、条件を満たす最初の技を選ぶキューを追加する。
- 実装案: `ConditionalEnemyActionQueue` を新規作成  
  - プロパティ: `entries: Array<{ actionType: ActionCtor; condition: (battle, self) => boolean }>`  
  - `next()` で先頭から順に `condition` を評価し、最初に true になったアクションを返す。どれも満たさない場合はデフォルト行動(例: Tackle)や skip を返す。  
  - `initialize` 時に優先度順のエントリを受け取り、`resetTurn`/`startTurn` 時にも同じロジックで選択するシンプル設計。
- 大王なめくじでのエントリ例:  
  1. `SummonAllyAction` 条件: `battle.enemyTeam.members.length < 5`  
  2. `FlurryAction` 条件: 常に true（フォールバック）

- 導入箇所: 大王なめくじ Enemy の `actionQueueFactory` に `new ConditionalEnemyActionQueue([...])` を指定。

## 不明点・要確認
- 追加敵の挿入演出: 新規カードをどの位置に挿すか（末尾固定で良いか）。  
  → 末尾固定。簡易フェードイン演出。  
- ActionLog/AnimationInstruction: 敵追加をどのステージで扱うか。  
  → `enemy-add` 新ステージを追加し、apply-patch で Snapshot にマージ。  
- 敵数上限: 「5体未満なら召喚可」を定数化して扱う。  
- 召喚された敵の行動初期化: 既存の「なめくじ」と同じ行動セット。召喚時に初手行動をランダムに決定。  
- Victory判定/キュー更新: 召喚時に EnemyActionQueue を初期化する想定でOK。  
- Snapshot差分: enemy-add では新規敵のみ渡す。  
- テスト範囲: 手動確認でOK（召喚→カード生成アニメ→行動ヒント更新を目視）。
