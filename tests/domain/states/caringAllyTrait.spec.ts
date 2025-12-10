import { describe, it, expect } from 'vitest'

import { Enemy } from '@/domain/entities/Enemy'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'
import { CaringAllyTrait, StrengthState } from '@/domain/entities/states'
import type { Battle } from '@/domain/battle/Battle'
import type { State } from '@/domain/entities/State'

function createEnemy(name: string, states: State[] = []) {
  return new Enemy({
    name,
    maxHp: 30,
    currentHp: 30,
    actions: [new SkipTurnAction('待機')],
    states,
    image: '',
  })
}

describe('仲間想いTraitの挙動', () => {
  it('味方が撃破されると所持者に打点上昇(10)が付与される', () => {
    const holder = createEnemy('所持者', [new CaringAllyTrait()])
    const victim = createEnemy('犠牲者')
    const battle = {
      enemyTeam: { members: [holder, victim] },
      recordDefeatAnimation: () => {},
      recordDamageAnimation: () => {},
    } as unknown as Battle

    victim.takeDamage(999, { battle })

    const strength = holder.states.find((state) => state.id === 'state-strength') as StrengthState | undefined
    expect(strength?.magnitude).toBe(10)
  })
})
