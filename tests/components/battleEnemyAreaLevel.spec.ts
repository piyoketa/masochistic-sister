import { describe, it, expect } from 'vitest'
import { formatEnemyNameWithLevel } from '@/components/battle/enemyNameFormatter'

describe('BattleEnemyArea レベル表示', () => {
  it('レベル2以上なら名前にLvを付与する', () => {
    expect(formatEnemyNameWithLevel('かたつむり', 2)).toBe('かたつむり Lv2')
    expect(formatEnemyNameWithLevel('かたつむり', 3)).toBe('かたつむり Lv3')
  })

  it('レベル1または未指定ならそのまま表示する', () => {
    expect(formatEnemyNameWithLevel('かたつむり', 1)).toBe('かたつむり')
    expect(formatEnemyNameWithLevel('かたつむり')).toBe('かたつむり')
  })
})
