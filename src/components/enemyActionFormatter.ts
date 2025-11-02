import type { EnemyActionHint } from '@/types/battle'

function formatStateText(prefixIcon: string, name: string, magnitude?: number): string {
  const magnitudeText = magnitude !== undefined ? `(${magnitude})` : ''
  return `${prefixIcon}${name}${magnitudeText}`
}

export function formatEnemyActionLabel(action: EnemyActionHint): string {
  if (action.acted) {
    return '💤行動済み'
  }

  if (action.type === 'skip') {
    return '⛓行動不可'
  }

  if (action.type === 'attack') {
    const pattern = action.pattern
    const amount = Math.max(0, Math.floor(pattern?.amount ?? 0))
    const count = Math.max(1, Math.floor(pattern?.count ?? 1))
    const isMulti = pattern?.type === 'multi' || count > 1
    const damageIcon = isMulti ? '⚔️' : '💥'
    const damageText = isMulti ? `${amount}×${count}` : `${amount}`
    const base = `${action.title}${damageIcon}${damageText}`

    const status = action.status
    if (status) {
      const statusText = formatStateText('🌀', status.name, status.magnitude)
      return `${base}+${statusText}`
    }

    return base
  }

  if (action.type === 'skill') {
    const state = action.selfState
    if (state) {
      const stateText = formatStateText('🔱', state.name, state.magnitude)
      return `${action.title}${stateText}`
    }

    return `${action.title}✨`
  }

  return action.title
}
