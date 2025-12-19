import type { EnemyActionHint } from '@/types/battle'

type Segment = {
  text: string
  showOverlay?: boolean
  highlighted?: boolean
  change?: 'up' | 'down'
  iconPath?: string
  tooltip?: string
}

type FormatOptions = {
  includeTitle?: boolean
}

export function formatEnemyActionLabel(
  hint: EnemyActionHint,
  _options: FormatOptions = {},
): { label: string; segments: Segment[] } {
  if (hint.type === 'attack') {
    return formatAttackHint(hint)
  }
  if (hint.type === 'skip') {
    const label = '行動不可'
    return { label, segments: [{ text: label, iconPath: '/assets/icons/skip.png' }] }
  }
  return formatSkillHint(hint)
}

function formatAttackHint(hint: EnemyActionHint): { label: string; segments: Segment[] } {
  const isMulti = (hint.pattern?.type ?? hint.calculatedPattern?.type) === 'multi'
  const icon = isMulti ? '⚔️' : '💥'
  const baseAmount = hint.pattern?.amount ?? 0
  const baseCount = hint.pattern?.count ?? 1
  const amount = hint.calculatedPattern?.amount ?? baseAmount
  const count = hint.calculatedPattern?.count ?? baseCount

  const segments: Segment[] = [
    { text: `${hint.title}: `, showOverlay: true },
    { text: icon, showOverlay: true },
    {
      text: `${amount}`,
      highlighted: hint.calculatedPattern?.amount !== undefined && amount !== baseAmount,
      change:
        hint.calculatedPattern?.amount !== undefined && amount !== baseAmount
          ? amount > baseAmount
            ? 'up'
            : 'down'
          : undefined,
      showOverlay: true,
    },
  ]

  if (isMulti) {
    segments.push({
      text: `×${count}`,
      highlighted: hint.calculatedPattern?.count !== undefined && count !== baseCount,
      change:
        hint.calculatedPattern?.count !== undefined && count !== baseCount
          ? count > baseCount
            ? 'up'
            : 'down'
          : undefined,
      showOverlay: true,
    })
  }

  if (hint.status) {
    const magnitude = hint.status.stackable ? hint.status.magnitude : undefined
    const label = magnitude !== undefined ? `${hint.status.name} ${magnitude}点` : hint.status.name
    segments.push({ text: '+' })
    segments.push({
      text: label,
      iconPath: hint.status.iconPath,
      tooltip: hint.status.description,
    })
  }

  const label = segments.map((segment) => segment.text).join('')
  return { label, segments }
}

function formatSkillHint(hint: EnemyActionHint): { label: string; segments: Segment[] } {
  const segments: Segment[] = []
  let label = hint.title

  const sparkleSegments: Segment[] = []
  const addSparkle = () => {
    sparkleSegments.push({ text: '✨' })
    label += '✨'
  }

  if (hint.selfState) {
    const magnitude = hint.selfState.stackable ? hint.selfState.magnitude : undefined
    const stateLabel = magnitude !== undefined ? `${hint.selfState.name} ${magnitude}点` : hint.selfState.name
    label = `${hint.title}：${stateLabel}`
    segments.push({ text: `${hint.title}：` })
    segments.push({ text: stateLabel, iconPath: hint.selfState.iconPath })
    return { label, segments }
  }

  // sparkle skills
  if (hint.description || hint.targetName) {
    addSparkle()
  }

  segments.push({ text: hint.title })
  segments.push(...sparkleSegments)

  if (hint.targetName) {
    const targetText = `→ ${hint.targetName}`
    label += targetText
    segments.push({ text: targetText })
  }

  return { label, segments }
}
