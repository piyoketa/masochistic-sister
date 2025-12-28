import { describe, it, expect } from 'vitest'

import { FiveLegsState } from '@/domain/entities/states/FiveLegsState'
import { StunCountState } from '@/domain/entities/states/StunCountState'
import { Enemy } from '@/domain/entities/Enemy'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { Damages } from '@/domain/entities/Damages'

describe('FiveLegsState の挙動', () => {
  it('ターン開始時、現在の閾値でスタンカウントを再付与する', () => {
    const fiveLegs = new FiveLegsState(10)
    const enemy = new Enemy({
      name: 'テスト敵',
      maxHp: 10,
      currentHp: 10,
      actions: [new SkipTurnAction('待機')],
      states: [fiveLegs, new StunCountState(3)],
      image: 'snail.png',
    })
    const battle = { addLogEntry: () => {} } as unknown as import('@/domain/battle/Battle').Battle

    fiveLegs.onTurnStart({ battle, owner: enemy })

    const stun = enemy.states.find((state) => state instanceof StunCountState) as StunCountState | undefined
    expect(stun).toBeDefined()
    expect(stun?.magnitude).toBe(10)
  })

  it('スタン成立時に必要値を+5し、次ターンのスタンカウントへ反映する', () => {
    const fiveLegs = new FiveLegsState(5)
    const enemy = new Enemy({
      name: 'テスト敵',
      maxHp: 10,
      currentHp: 10,
      actions: [new SkipTurnAction('待機')],
      states: [fiveLegs, new StunCountState(1)],
      image: 'snail.png',
    })
    const battle = {
      addLogEntry: () => {},
    } as unknown as import('@/domain/battle/Battle').Battle
    const attacker = new ProtagonistPlayer()
    const attack = new SkipTurnAction('hit')
    const damages = new Damages({ baseAmount: 1, baseCount: 1, type: 'single', cardId: 'test-card' })
    const stun = enemy.states.find((state) => state instanceof StunCountState) as StunCountState

    stun.onHitResolved({
      battle,
      attack,
      attacker,
      defender: enemy,
      damages,
      index: 0,
      outcome: { damage: 1, effectType: 'test' },
      role: 'defender',
    })

    // スタンでカウントが消え、必要値が10へ上がる
    expect(enemy.states.some((state) => state instanceof StunCountState)).toBe(false)
    expect(fiveLegs.magnitude).toBe(10)

    fiveLegs.onTurnStart({ battle, owner: enemy })
    const nextStun = enemy.states.find((state) => state instanceof StunCountState) as StunCountState | undefined
    expect(nextStun?.magnitude).toBe(10)
  })
})
