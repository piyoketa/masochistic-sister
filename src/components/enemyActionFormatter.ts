import type { EnemyActionHint } from '@/types/battle'

function formatStateText(prefixIcon: string, name: string, magnitude?: number): string {
  const magnitudeText = magnitude !== undefined ? `(${magnitude})` : ''
  return `${prefixIcon}${name}${magnitudeText}`
}

export interface FormattedEnemyActionLabel {
  label: string
  segments: Array<{
    text: string
    highlighted?: boolean
    change?: 'up' | 'down'
    showOverlay?: boolean
    iconPath?: string
    tooltip?: string
  }>
}

export function formatEnemyActionLabel(
  action: EnemyActionHint,
  options: { includeTitle?: boolean } = {},
): FormattedEnemyActionLabel {
  const includeTitle = true
  const segments: Array<{
    text: string
    highlighted?: boolean
    change?: 'up' | 'down'
    showOverlay?: boolean
    iconPath?: string
    tooltip?: string
  }> = []
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

    const attackPattern = calculatedPattern?.type ?? pattern?.type ?? 'single'
    const isMulti = attackPattern === 'multi'
    const damageIcon = isMulti ? '⚔️' : '💥'

    if (includeTitle && action.title) {
      // 技名に hover した際も ActionCardOverlay を出すため showOverlay を付与する。
      segments.push({ text: `${action.title}: `, showOverlay: true })
    }

    segments.push({ text: damageIcon, showOverlay: true })

    const amountChanged = baseAmount !== undefined && amount !== baseAmount
    const amountChange: 'up' | 'down' | undefined =
      amountChanged && baseAmount !== undefined
        ? amount > baseAmount
          ? 'up'
          : 'down'
        : undefined
    segments.push({
      text: `${amount}`,
      highlighted: amountChanged,
      change: amountChange,
      showOverlay: true,
    })

    if (isMulti) {
      const countChanged = baseCount !== undefined && count !== baseCount
      const countChange: 'up' | 'down' | undefined =
        countChanged && baseCount !== undefined ? (count > baseCount ? 'up' : 'down') : undefined
      segments.push({
        text: `×${count}`,
        highlighted: countChanged,
        change: countChange,
        showOverlay: true,
      })
    }

    const status = action.status
    if (status) {
      segments.push({ text: '+' })
      segments.push({
        text: formatStateText('', status.name, status.magnitude),
        iconPath: status.iconPath,
      })
    }
    const effectTags =
      action.cardInfo && 'effectTags' in action.cardInfo && Array.isArray(action.cardInfo.effectTags)
        ? action.cardInfo.effectTags
        : []
    if (effectTags.length > 0) {
      effectTags.forEach((tag, index) => {
        segments.push({ text: index === 0 && !status ? '+' : ' ' })
        segments.push({
          text: formatStateText('', tag.label),
          iconPath: tag.iconPath,
          tooltip: tag.description,
        })
      })
    }

    appendTarget()
    const label = segments.map((segment) => segment.text).join('')
    return { label, segments }
  }

  if (action.type === 'skill') {
    const state = action.selfState ?? action.status
    if (state) {
      if (includeTitle) {
        segments.push({ text: `${action.title}：` })
      }
      segments.push({
        text: formatStateText('', state.name, state.magnitude),
        iconPath: state.iconPath,
      })
      const effectTags =
        action.cardInfo && 'effectTags' in action.cardInfo && Array.isArray(action.cardInfo.effectTags)
          ? action.cardInfo.effectTags
          : []
      if (effectTags.length > 0) {
        effectTags.forEach((tag) => {
          segments.push({ text: '+' })
          segments.push({
            text: formatStateText('', tag.label),
            iconPath: tag.iconPath,
            tooltip: tag.description,
          })
        })
      }
      appendTarget()
      const label = segments.map((segment) => segment.text).join('')
      return { label, segments }
    }

    if (includeTitle && action.description) {
      segments.push({ text: action.title })
      segments.push({ text: '✨' })
      appendTarget()
      const label = segments.map((segment) => segment.text).join('')
      return { label, segments }
    }

    if (includeTitle && action.title) {
      segments.push({ text: action.title })
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
