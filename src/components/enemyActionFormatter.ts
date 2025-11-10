import type { EnemyActionHint } from '@/types/battle'

function formatStateText(prefixIcon: string, name: string, magnitude?: number): string {
  const magnitudeText = magnitude !== undefined ? `(${magnitude})` : ''
  return `${prefixIcon}${name}${magnitudeText}`
}

export interface FormattedEnemyActionLabel {
  label: string
  segments: Array<{ text: string; highlighted?: boolean }>
}

export function formatEnemyActionLabel(
  action: EnemyActionHint,
  options: { includeTitle?: boolean } = {},
): FormattedEnemyActionLabel {
  const includeTitle = options.includeTitle ?? true
  const segments: Array<{ text: string; highlighted?: boolean }> = []
  const appendTarget = () => {
    if (!action.targetName) {
      return
    }
    segments.push({ text: `→ ${action.targetName}` })
  }

  if (action.type === 'skip') {
    const text = '⛓行動不可'
    return { label: text, segments: [{ text }] }
  }

  if (action.type === 'attack') {
    const pattern = action.pattern
    const calculatedPattern = action.calculatedPattern ?? pattern

    const baseAmount = pattern?.amount !== undefined ? Math.floor(pattern.amount) : undefined
    const baseCount = pattern?.count !== undefined ? Math.floor(pattern.count) : undefined

    const amount = Math.max(0, Math.floor(calculatedPattern?.amount ?? pattern?.amount ?? 0))
    const count = Math.max(1, Math.floor(calculatedPattern?.count ?? pattern?.count ?? 1))

    const isMulti = pattern?.type === 'multi' || count > 1
    const damageIcon = isMulti ? '⚔️' : '💥'

    if (includeTitle) {
      segments.push({ text: action.title })
    }

    segments.push({ text: damageIcon })

    const amountChanged = baseAmount !== undefined && amount !== baseAmount
    segments.push({ text: `${amount}`, highlighted: amountChanged })

    if (isMulti) {
      const countChanged = baseCount !== undefined && count !== baseCount
      segments.push({ text: `×${count}`, highlighted: countChanged })
    }

    const status = action.status
    if (status) {
      segments.push({ text: '+' })
      segments.push({ text: formatStateText('🌀', status.name, status.magnitude) })
    }

    appendTarget()
    const label = segments.map((segment) => segment.text).join('')
    return { label, segments }
  }

  if (action.type === 'skill') {
    const state = action.selfState
    if (state) {
      if (includeTitle) {
        segments.push({ text: `${action.title}：` })
      }
      segments.push({ text: formatStateText('🔱', state.name, state.magnitude) })
      appendTarget()
      const label = segments.map((segment) => segment.text).join('')
      return { label, segments }
    }

    if (includeTitle) {
      segments.push({ text: action.title })
      segments.push({ text: '✨' })
      appendTarget()
      const label = segments.map((segment) => segment.text).join('')
      return { label, segments }
    }

    segments.push({ text: '✨' })
    appendTarget()
    const label = segments.map((segment) => segment.text).join('')
    return { label, segments }
  }

  const fallback = includeTitle ? action.title : ''
  const segmentsFallback = fallback ? [{ text: fallback }] : []
  return { label: fallback, segments: segmentsFallback }
}
