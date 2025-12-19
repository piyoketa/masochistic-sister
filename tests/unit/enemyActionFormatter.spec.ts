import { describe, it, expect } from 'vitest'

import { formatEnemyActionLabel } from '@/components/enemyActionFormatter.ts'
import type { EnemyActionHint } from '@/types/battle'

const normalizeStatePreview = (
  state?: EnemyActionHint['status'] | EnemyActionHint['selfState'],
): EnemyActionHint['status'] | EnemyActionHint['selfState'] | undefined => {
  if (!state) return undefined
  const stackable = (state as { stackable?: boolean }).stackable ?? true
  if (stackable) {
    return {
      name: state.name,
      description: state.description,
      iconPath: state.iconPath,
      stackable: true,
      magnitude: state.magnitude ?? 0,
    }
  }
  return {
    name: state.name,
    description: state.description,
    iconPath: state.iconPath,
    stackable: false,
    magnitude: undefined,
  }
}

const baseHint = (
  overrides: Partial<Omit<EnemyActionHint, 'status' | 'selfState'>> & {
    status?: EnemyActionHint['status'] | EnemyActionHint['selfState']
    selfState?: EnemyActionHint['status'] | EnemyActionHint['selfState']
  },
): EnemyActionHint => ({
  title: overrides.title ?? 'unknown',
  type: overrides.type ?? 'skill',
  description: overrides.description,
  targetName: overrides.targetName,
  pattern: overrides.pattern,
  calculatedPattern: overrides.calculatedPattern,
  status: normalizeStatePreview(overrides.status) as EnemyActionHint['status'] | undefined,
  selfState: normalizeStatePreview(overrides.selfState) as EnemyActionHint['selfState'] | undefined,
  acted: overrides.acted,
  icon: overrides.icon,
  cardInfo: overrides.cardInfo,
})

describe('formatEnemyActionLabel', () => {
  it('formats single damage attack', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({
        title: '殴打',
        type: 'attack',
        pattern: { amount: 20, count: 1, type: 'single' },
      }),
    )
    expect(label).toBe('殴打: 💥20')
    expect(segments).toEqual([
      { text: '殴打: ', showOverlay: true },
      { text: '💥', showOverlay: true },
      { text: '20', highlighted: false, change: undefined, showOverlay: true },
    ])
  })

  it('formats status inflicting single attack', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({
        title: '溶かす',
        type: 'attack',
        pattern: { amount: 5, count: 1, type: 'single' },
        status: { name: '腐食', magnitude: 1, iconPath: '/assets/icons/debuff.png' },
      }),
    )
    expect(label).toBe('溶かす: 💥5+腐食 10点')
    expect(segments).toEqual([
      { text: '溶かす: ', showOverlay: true },
      { text: '💥', showOverlay: true },
      { text: '5', highlighted: false, change: undefined, showOverlay: true },
      { text: '+' },
      { text: '腐食 10点', iconPath: '/assets/icons/debuff.png' },
    ])
  })

  it('状態異常の説明を tooltip に含める', () => {
    const { segments } = formatEnemyActionLabel(
      baseHint({
        title: '溶かす',
        type: 'attack',
        pattern: { amount: 5, count: 1, type: 'single' },
        status: {
          name: '腐食',
          magnitude: 1,
          iconPath: '/assets/icons/debuff.png',
          description: '受ける物理ダメージが増加する',
        },
      }),
    )
    expect(segments).toEqual([
      { text: '溶かす: ', showOverlay: true },
      { text: '💥', showOverlay: true },
      { text: '5', highlighted: false, change: undefined, showOverlay: true },
      { text: '+' },
      {
        text: '腐食 10点',
        iconPath: '/assets/icons/debuff.png',
        tooltip: '受ける物理ダメージが増加する',
      },
    ])
  })

  it('formats multi hit attack', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({
        title: '突き刺す',
        type: 'attack',
        pattern: { amount: 10, count: 3, type: 'multi' },
      }),
    )
    expect(label).toBe('突き刺す: ⚔️10×3')
    expect(segments).toEqual([
      { text: '突き刺す: ', showOverlay: true },
      { text: '⚔️', showOverlay: true },
      { text: '10', highlighted: false, change: undefined, showOverlay: true },
      { text: '×3', highlighted: false, change: undefined, showOverlay: true },
    ])
  })

  it('formats skill that grants self state', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({
        title: 'ビルドアップ',
        type: 'skill',
        selfState: { name: '筋肉強化', magnitude: 10, iconPath: '/assets/icons/buff.png' },
      }),
    )
    expect(label).toBe('ビルドアップ：筋肉強化 10点')
    expect(segments).toEqual([
      { text: 'ビルドアップ：' },
      { text: '筋肉強化 10点', iconPath: '/assets/icons/buff.png' },
    ])
  })

  it('formats skip action', () => {
    const { label, segments } = formatEnemyActionLabel(baseHint({ title: '足止め', type: 'skip' }))
    expect(label).toBe('行動不可')
    expect(segments).toEqual([{ text: '行動不可', iconPath: '/assets/icons/skip.png' }])
  })

  it('formats other skills with sparkle', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({ title: '手札入れ替え', type: 'skill', description: '手札を1枚捨てて1枚引く' }),
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
        title: '突き刺す',
        type: 'attack',
        pattern: { amount: 10, count: 2, type: 'multi' },
      }),
      { includeTitle: false },
    )
    expect(label).toBe('突き刺す: ⚔️10×2')
    expect(segments).toEqual([
      { text: '突き刺す: ', showOverlay: true },
      { text: '⚔️', showOverlay: true },
      { text: '10', highlighted: false, change: undefined, showOverlay: true },
      { text: '×2', highlighted: false, change: undefined, showOverlay: true },
    ])
  })

  it('highlights changed damage values', () => {
    const { label, segments } = formatEnemyActionLabel(
      baseHint({
        title: '突き刺す',
        type: 'attack',
        pattern: { amount: 10, count: 3, type: 'multi' },
        calculatedPattern: { amount: 15, count: 4 },
      }),
    )
    expect(label).toBe('突き刺す: ⚔️15×4')
    expect(segments).toEqual([
      { text: '突き刺す: ', showOverlay: true },
      { text: '⚔️', showOverlay: true },
      { text: '15', highlighted: true, change: 'up', showOverlay: true },
      { text: '×4', highlighted: true, change: 'up', showOverlay: true },
    ])
  })
})
