import { describe, it, expect, beforeEach } from 'vitest'
import { Enemy } from '@/domain/entities/Enemy'
import { DarkBlessingAction } from '@/domain/entities/actions/DarkBlessingAction'
import { LargeState } from '@/domain/entities/states/LargeState'
import type { Battle } from '@/domain/battle/Battle'

function createEnemy(name: string, withLarge = false): Enemy {
  return new Enemy({
    name,
    maxHp: 30,
    currentHp: 30,
    actions: [],
    image: '/dummy.png',
    states: withLarge ? [new LargeState()] : [],
  })
}

describe('闇の加護', () => {
  let healer: Enemy
  let ally: Enemy
  let battle: Battle

  beforeEach(() => {
    healer = createEnemy('caster')
    ally = createEnemy('ally')
    healer.assignId(1)
    ally.assignId(2)
    const enemyTeam = {
      members: [healer, ally],
      findEnemy: (id: number) => [healer, ally].find((e) => e.id === id),
    }
    battle = {
      enemyTeam,
      turnPosition: { turn: 1, side: 'player' },
      addLogEntry: () => {},
      notifyActionResolved: () => {},
    } as unknown as Battle
  })

  it('全員が天の鎖無効なら使用不可になる', () => {
    healer.addState(new LargeState())
    ally.addState(new LargeState())
    const action = new DarkBlessingAction()
    expect(action.canUse({ battle, source: healer })).toBe(false)
  })

  it('天の鎖無効を持たない味方がいる場合に付与できる', () => {
    const action = new DarkBlessingAction()
    expect(action.canUse({ battle, source: healer })).toBe(true)
    const planned = action.planTarget({ battle, source: healer, team: battle.enemyTeam as any })
    expect(planned).toBe(true)

    const context = { battle, source: healer, metadata: {} } as any
    action.execute(context)
    // どちらかの味方に天の鎖無効が付与されていることを確認する
    const anyGranted = [healer, ally].some((e) => e.getStates().some((s) => s.id === 'state-large'))
    expect(anyGranted).toBe(true)
  })
})
