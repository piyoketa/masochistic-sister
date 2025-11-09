import { describe, it, expect } from 'vitest'

import { Enemy } from '@/domain/entities/Enemy'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { AccelerationState, LargeState } from '@/domain/entities/states'

function createEnemyWithStates(states = []): Enemy {
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
})
