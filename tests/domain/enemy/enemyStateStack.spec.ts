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

  it('大型などスタック対象外のStateは再付与しても増えない', () => {
    const enemy = createEnemyWithStates([new LargeState()])

    enemy.addState(new LargeState())

    expect(enemy.states.filter((state) => state.id === 'state-large')).toHaveLength(1)
  })

  it('重量化は再付与しても1段のまま据え置きになる', () => {
    const enemy = createEnemyWithStates([new HeavyweightState()])

    enemy.addState(new HeavyweightState())

    const heavy = enemy.states.find((state) => state.id === 'state-heavyweight')
    expect(heavy).toBeDefined()
    expect(heavy?.isStackable()).toBe(false)
    expect(heavy?.magnitude).toBeUndefined()
    expect(enemy.states.filter((state) => state.id === 'state-heavyweight')).toHaveLength(1)
  })

  it('軽量化も非スタックで1段のまま維持される', () => {
    const enemy = createEnemyWithStates([new LightweightState()])

    enemy.addState(new LightweightState())

    const light = enemy.states.find((state) => state.id === 'state-lightweight')
    expect(light).toBeDefined()
    expect(light?.isStackable()).toBe(false)
    expect(light?.magnitude).toBeUndefined()
    expect(enemy.states.filter((state) => state.id === 'state-lightweight')).toHaveLength(1)
  })
})
