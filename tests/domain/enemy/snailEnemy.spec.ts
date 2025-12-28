import { describe, it, expect } from 'vitest'
import { SnailEnemy } from '@/domain/entities/enemies/SnailEnemy'
import { HardShellState } from '@/domain/entities/states/HardShellState'

describe('SnailEnemy のレベル別初期化', () => {
  it('レベル3でもHPは20に張り付く', () => {
    // Lv2でHPを20に上げる設定がLv3でも維持されることを確認する（未定義レベルは上限に張り付く仕様）
    const enemy = new SnailEnemy({ level: 3 })

    expect(enemy.maxHp).toBe(20)
    expect(enemy.currentHp).toBe(20)
  })

  it('レベル3では硬殻のmagnitudeが25になる', () => {
    const enemy = new SnailEnemy({ level: 3 })
    const hardShell = enemy.states.find((state) => state instanceof HardShellState) as HardShellState | undefined

    expect(hardShell?.magnitude).toBe(25)
  })
})
