#!/usr/bin/env node
/**
 * Vite開発サーバーを起動する前に、アニメーションデバッグ用の環境変数を自動設定するスクリプト。
 */
import { spawn } from 'node:child_process'

const env = { ...process.env }

// ファイル変更検知のためのポーリング設定
// https://chatgpt.com/c/69185d47-8d0c-8321-8cf3-eaa5ab78bf96
env.CHOKIDAR_USEPOLLING = 'true'
env.WATCHPACK_POLLING = 'true'

// env.VITE_DEBUG_CARD_ELIMINATE = 'true'
// env.VITE_DEBUG_HAND_ANIMATION = 'true'
// 
env.VITE_DEBUG_ANIMATION_LOG = 'true'
//
env.VITE_DEBUG_HAND_STAGE_EVENTS='false'
//
env.VITE_DEBUG_PLAYER_IMAGE='false'
//
env.VITE_DEBUG_PLAYER_CARDS='false'
//
env.VITE_DEBUG_ENEMY_ACTED = 'false'
//
env.VITE_DEBUG_PLAYER_HP_LOG = 'false'
//
env.VITE_ASSET_PRELOAD_LOG='false'
// HP予測をデバッグ時にOFFにしたい場合にtrueへ
env.VITE_DISABLE_HP_PREDICTION='false'
// 味方バフ（追い風など）のターゲット抽選を追跡したい場合に true にする。
env.VITE_DEBUG_ALLY_BUFF_PLAN='false'
// 味方バフの実行結果（付与/スキップ）を追跡したい場合に true にする。
env.VITE_DEBUG_ALLY_BUFF_APPLY='false'
// 敵行動ヒント生成の入力/出力ログを追跡したい場合に true にする。
env.VITE_DEBUG_ENEMY_HINT_LOG='false'
// 敵行動中の予測固定が効いているかを追跡したい場合に true にする。
env.VITE_DEBUG_ENEMY_PREDICTION='true'
// レリック usable 判定のデバッグログ。/battle/testcase3 での入力ロック解除後のスナップショット確認用。
env.VITE_DEBUG_RELIC_USABLE_LOG='false'
// 蘇る記憶の isActive 判定をトレースする場合に true にする。
env.VITE_DEBUG_FLASHBACK_ACTIVE='false'
// 手札表示時の isActive 判定をトレースする場合に true にする。
env.VITE_DEBUG_HAND_ACTIVE='false'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const child = spawn(npmCommand, ['exec', 'vite'], {
  stdio: 'inherit',
  env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})
