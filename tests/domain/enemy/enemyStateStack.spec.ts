import { describe, it, expect } from 'vitest'

import { Enemy } from '@/domain/entities/Enemy'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { AccelerationState, LargeState, HeavyweightState, LightweightState } from '@/domain/entities/states'
import type { State } from '@/domain/entities/State'

function createEnemyWithStates(states: State[] = []): Enemy {
  return new Enemy({
    name: 'テスト敵',
    maxHp: 30,
    currentHp: 30,
    actions: [new BattlePrepAction()],
    image: 'enemy.png',
    states,
  })
}

describe('Enemy.addState のスタック処理', () => {
  it('同じStateを追加するとmagnitudeが加算される', () => {
    const enemy = createEnemyWithStates([new AccelerationState(1)])

    enemy.addState(new AccelerationState(1))

    const stacked = enemy.states.find((state) => state.id === 'state-acceleration')
    expect(stacked?.magnitude).toBe(2)
    expect(enemy.states.filter((state) => state.id === 'state-acceleration')).toHaveLength(1)
  })

  it('天の鎖無効などスタック対象外のStateは再付与しても増えない', () => {
    const enemy = createEnemyWithStates([new LargeState()])

    enemy.addState(new LargeState())

    expect(enemy.states.filter((state) => state.id === 'state-large')).toHaveLength(1)
  })

  it('重量化は再付与でスタックが加算される', () => {
    const enemy = createEnemyWithStates([new HeavyweightState(1)])

    enemy.addState(new HeavyweightState(2))

    const heavy = enemy.states.find((state) => state.id === 'state-heavyweight')
    expect(heavy).toBeDefined()
    expect(heavy?.isStackable()).toBe(true)
    expect(heavy?.magnitude).toBe(3)
    expect(enemy.states.filter((state) => state.id === 'state-heavyweight')).toHaveLength(1)
  })

  it('軽量化も再付与でスタックが加算される', () => {
    const enemy = createEnemyWithStates([new LightweightState(1)])

    enemy.addState(new LightweightState(1))

    const light = enemy.states.find((state) => state.id === 'state-lightweight')
    expect(light).toBeDefined()
    expect(light?.isStackable()).toBe(true)
    expect(light?.magnitude).toBe(2)
    expect(enemy.states.filter((state) => state.id === 'state-lightweight')).toHaveLength(1)
  })
})
