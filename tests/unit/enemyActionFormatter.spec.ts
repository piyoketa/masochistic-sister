import { describe, it, expect } from 'vitest'

import { formatEnemyActionLabel } from '@/components/enemyActionFormatter.ts'
import type { EnemyActionHint } from '@/types/battle'

const baseHint = (overrides: Partial<EnemyActionHint>): EnemyActionHint => ({
  title: overrides.title ?? 'unknown',
  type: overrides.type ?? 'skill',
  description: overrides.description,
  targetName: overrides.targetName,
  pattern: overrides.pattern,
  calculatedPattern: overrides.calculatedPattern,
  status: overrides.status,
  selfState: overrides.selfState,
  acted: overrides.acted,
  icon: overrides.icon,
})

describe('formatEnemyActionLabel', () => {
  it('formats single damage attack', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({
        title: 'たいあたり',
        type: 'attack',
        pattern: { amount: 20, count: 1, type: 'single' },
      }),
    )
    expect(label).toBe('たいあたり💥20')
    expect(segments).toEqual([
      { text: 'たいあたり' },
      { text: '💥' },
      { text: '20', highlighted: false },
    ])
  })

  it('formats status inflicting single attack', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({
        title: '吸いつく',
        type: 'attack',
        pattern: { amount: 5, count: 1, type: 'single' },
        status: { name: '腐食', magnitude: 1 },
      }),
    )
    expect(label).toBe('吸いつく💥5+🌀腐食(1)')
    expect(segments).toEqual([
      { text: '吸いつく' },
      { text: '💥' },
      { text: '5', highlighted: false },
      { text: '+' },
      { text: '🌀腐食(1)' },
    ])
  })

  it('formats multi hit attack', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({
        title: '乱れ突き',
        type: 'attack',
        pattern: { amount: 10, count: 3, type: 'multi' },
      }),
    )
    expect(label).toBe('乱れ突き⚔️10×3')
    expect(segments).toEqual([
      { text: '乱れ突き' },
      { text: '⚔️' },
      { text: '10', highlighted: false },
      { text: '×3', highlighted: false },
    ])
  })

  it('formats skill that grants self state', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({
        title: 'ビルドアップ',
        type: 'skill',
        selfState: { name: '筋肉強化', magnitude: 10 },
      }),
    )
    expect(label).toBe('ビルドアップ：🔱筋肉強化(10)')
    expect(segments).toEqual([
      { text: 'ビルドアップ：' },
      { text: '🔱筋肉強化(10)' },
    ])
  })

  it('formats skip action', () => {
    const { label, segments } = formatEnemyActionLabel(baseHint({ title: '足止め', type: 'skip' }))
    expect(label).toBe('⛓行動不可')
    expect(segments).toEqual([{ text: '⛓行動不可' }])
  })

  it('formats other skills with sparkle', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({ title: '手札入れ替え', type: 'skill' }),
    )
    expect(label).toBe('手札入れ替え✨')
    expect(segments).toEqual([{ text: '手札入れ替え' }, { text: '✨' }])
  })

  it('appends target name for ally-targeting skills', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({ title: '追い風', type: 'skill', targetName: 'なめくじ' }),
    )
    expect(label).toBe('追い風✨→ なめくじ')
    expect(segments).toEqual([{ text: '追い風' }, { text: '✨' }, { text: '→ なめくじ' }])
  })

  it('omits title when requested', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({
        title: '乱れ突き',
        type: 'attack',
        pattern: { amount: 10, count: 2, type: 'multi' },
      }),
      { includeTitle: false },
    )
    expect(label).toBe('⚔️10×2')
    expect(segments).toEqual([
      { text: '⚔️' },
      { text: '10', highlighted: false },
      { text: '×2', highlighted: false },
    ])
  })

  it('highlights changed damage values', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({
        title: '乱れ突き',
        type: 'attack',
        pattern: { amount: 10, count: 3, type: 'multi' },
        calculatedPattern: { amount: 15, count: 4 },
      }),
    )
    expect(label).toBe('乱れ突き⚔️15×4')
    expect(segments).toEqual([
      { text: '乱れ突き' },
      { text: '⚔️' },
      { text: '15', highlighted: true },
      { text: '×4', highlighted: true },
    ])
  })
})
