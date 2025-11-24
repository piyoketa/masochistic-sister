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

// env.VITE_DEBUG_ANIMATION_LOG = 'true'
// env.VITE_DEBUG_CARD_ELIMINATE = 'true'
// env.VITE_DEBUG_HAND_ANIMATION = 'true'
// env.VITE_DEBUG_HAND_STAGE_EVENTS='true'
env.VITE_DEBUG_PLAYER_IMAGE='true'

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
