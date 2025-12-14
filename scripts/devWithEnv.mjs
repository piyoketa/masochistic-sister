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
env.VITE_DEBUG_ANIMATION_LOG = 'true'
env.VITE_DEBUG_HAND_STAGE_EVENTS='false'
env.VITE_DEBUG_PLAYER_IMAGE='false'
env.VITE_DEBUG_PLAYER_CARDS='false'
// HP系の調査ログはデフォルトでオフ。必要ならVITE_DEBUG_PLAYER_HP_LOG=trueを明示的に設定する。
if (!('VITE_DEBUG_PLAYER_HP_LOG' in env)) {
  env.VITE_DEBUG_PLAYER_HP_LOG = 'false'
}
env.VITE_ASSET_PRELOAD_LOG='false'

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
