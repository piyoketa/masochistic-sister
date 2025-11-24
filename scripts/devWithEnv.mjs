#!/usr/bin/env node
/**
 * Vite開発サーバーを起動する前に、アニメーションデバッグ用の環境変数を自動設定するスクリプト。
 */
import { spawn } from 'node:child_process'

const env = { ...process.env }
if (!env.VITE_DEBUG_ANIMATION_LOG) {
  env.VITE_DEBUG_ANIMATION_LOG = 'true'
}
if (!env.VITE_DEBUG_CARD_ELIMINATE) {
  env.VITE_DEBUG_CARD_ELIMINATE = 'true'
}
if (!env.VITE_DEBUG_HAND_ANIMATION) {
  env.VITE_DEBUG_HAND_ANIMATION = 'true'
}

// ファイル変更検知のためのポーリング設定
// https://chatgpt.com/c/69185d47-8d0c-8321-8cf3-eaa5ab78bf96
if (!env.VITE_DEBUG_HAND_ANIMATION) {
  env.CHOKIDAR_USEPOLLING = 'true'
}
if (!env.VITE_DEBUG_HAND_ANIMATION) {
  env.WATCHPACK_POLLING = 'true'
}

env.VITE_DEBUG_HAND_STAGE_EVENTS='true'

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
