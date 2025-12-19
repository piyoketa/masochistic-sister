import { describe, it, expect, beforeEach } from 'vitest'
import { Enemy } from '@/domain/entities/Enemy'
import { SelfRegenerationAction } from '@/domain/entities/actions/SelfRegenerationAction'
import type { Battle } from '@/domain/battle/Battle'

function createEnemy(currentHp: number, maxHp: number): Enemy {
  return new Enemy({
    name: '自己再生テスト',
    maxHp,
    currentHp,
    actions: [],
    image: '/dummy.png',
  })
}

describe('自己再生', () => {
  let enemy: Enemy
  let battle: Battle

  beforeEach(() => {
    enemy = createEnemy(20, 60)
    battle = {
      addLogEntry: () => {},
      notifyActionResolved: () => {},
    } as unknown as Battle
  })

  it('HPが減っているときだけ使用可能', () => {
    const action = new SelfRegenerationAction()
    expect(action.canUse({ battle, source: enemy })).toBe(true)
    enemy.setCurrentHp(enemy.maxHp)
    expect(action.canUse({ battle, source: enemy })).toBe(false)
  })

  it('実行でHPを40回復し、最大値を超えない', () => {
    const action = new SelfRegenerationAction()
    const context = { battle, source: enemy, metadata: {} } as any
    action.execute(context)
    expect(enemy.currentHp).toBe(60) // 20 + 40, 上限60でクランプ
  })

  it('HP満タンの場合はスキップメタデータを付与する', () => {
    enemy.setCurrentHp(enemy.maxHp)
    const action = new SelfRegenerationAction()
    const context = { battle, source: enemy, metadata: {} } as any
    action.execute(context)
    expect(context.metadata?.skipReason).toBe('hp-full')
  })
})
