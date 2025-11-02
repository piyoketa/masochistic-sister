import { describe, it, expect } from 'vitest'

import { formatEnemyActionLabel } from '@/components/enemyActionFormatter'
import type { EnemyActionHint } from '@/types/battle'

const baseHint = (overrides: Partial<EnemyActionHint>): EnemyActionHint => ({
  title: overrides.title ?? 'unknown',
  type: overrides.type ?? 'skill',
  description: overrides.description,
  pattern: overrides.pattern,
  status: overrides.status,
  selfState: overrides.selfState,
  acted: overrides.acted,
  icon: overrides.icon,
})

describe('formatEnemyActionLabel', () => {
  it('returns acted label when enemy already acted', () => {
    const label = formatEnemyActionLabel(baseHint({ title: '行動済み', type: 'skill', acted: true }))
    expect(label).toBe('💤行動済み')
  })

  it('formats single damage attack', () => {
    const label = formatEnemyActionLabel(
      baseHint({
        title: 'たいあたり',
        type: 'attack',
        pattern: { amount: 20, count: 1, type: 'single' },
      }),
    )
    expect(label).toBe('たいあたり💥20')
  })

  it('formats status inflicting single attack', () => {
    const label = formatEnemyActionLabel(
      baseHint({
        title: '酸を吐く',
        type: 'attack',
        pattern: { amount: 5, count: 1, type: 'single' },
        status: { name: '腐食', magnitude: 1 },
      }),
    )
    expect(label).toBe('酸を吐く💥5+🌀腐食(1)')
  })

  it('formats multi hit attack', () => {
    const label = formatEnemyActionLabel(
      baseHint({
        title: '乱れ突き',
        type: 'attack',
        pattern: { amount: 10, count: 3, type: 'multi' },
      }),
    )
    expect(label).toBe('乱れ突き⚔️10×3')
  })

  it('formats skill that grants self state', () => {
    const label = formatEnemyActionLabel(
      baseHint({
        title: 'ビルドアップ',
        type: 'skill',
        selfState: { name: '筋肉強化', magnitude: 10 },
      }),
    )
    expect(label).toBe('ビルドアップ🔱筋肉強化(10)')
  })

  it('formats skip action', () => {
    const label = formatEnemyActionLabel(baseHint({ title: '足止め', type: 'skip' }))
    expect(label).toBe('⛓行動不可')
  })

  it('formats other skills with sparkle', () => {
    const label = formatEnemyActionLabel(baseHint({ title: '手札入れ替え', type: 'skill' }))
    expect(label).toBe('手札入れ替え✨')
  })
})
