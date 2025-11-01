import { describe, it, expect } from 'vitest'

import { TentacleFlurryAction } from '@/domain/entities/actions/TentacleFlurryAction'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import {
  StrengthState,
  AccelerationState,
  CorrosionState,
  HardShellState,
  StickyState,
} from '@/domain/entities/states'
import { Enemy } from '@/domain/entities/Enemy'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'
import type { State } from '@/domain/entities/State'
import { Hand } from '@/domain/battle/Hand'
import { Card } from '@/domain/entities/Card'

function createPlayerWithHand() {
  const player = new ProtagonistPlayer()
  const hand = new Hand()
  player.bindHand(hand)

  return {
    player,
    addState: (state: State) => {
      hand.add(new Card({ state }))
      return state
    },
  }
}

function createEnemyWithStates(states: State[] = []): Enemy {
  return new Enemy({
    name: 'dummy',
    maxHp: 10,
    currentHp: 10,
    actions: [new SkipTurnAction('dummyは様子を見ている')],
    states,
  })
}

describe('Attack#calcDamagesの挙動', () => {
  it('筋力や状態が無い場合は10ダメージ×3回になる', () => {
    const action = new TentacleFlurryAction()
    const attacker = createPlayerWithHand().player
    const defender = createEnemyWithStates()

    const damages = action.calcDamages(attacker, defender)

    expect(damages.amount).toBe(10)
    expect(damages.count).toBe(3)
    expect(damages.type).toBe('multi')
    expect(damages.attackerStates).toHaveLength(0)
    expect(damages.defenderStates).toHaveLength(0)
  })

  it('攻撃側に筋力上昇(10)があるとダメージが20に増える', () => {
    const action = new TentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    const defender = createEnemyWithStates()
    const strength = attackerHelper.addState(new StrengthState(10))

    const damages = action.calcDamages(attackerHelper.player, defender)

    expect(damages.amount).toBe(20)
    expect(damages.count).toBe(3)
    expect(damages.attackerStates).toContain(strength)
  })

  it('攻撃側の筋力上昇と防御側の腐食が重なるとダメージが30になる', () => {
    const action = new TentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    const defenderEnemy = createEnemyWithStates()
    const strength = attackerHelper.addState(new StrengthState(10))
    const corrosion = new CorrosionState(1)
    defenderEnemy.addState(corrosion)

    const damages = action.calcDamages(attackerHelper.player, defenderEnemy)

    expect(damages.amount).toBe(30)
    expect(damages.count).toBe(3)
    expect(damages.attackerStates).toContain(strength)
    expect(damages.defenderStates).toContain(corrosion)
  })

  it('筋力上昇と加速、腐食が揃うとダメージ30の4回攻撃になる', () => {
    const action = new TentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    const defenderEnemy = createEnemyWithStates()
    const strength = attackerHelper.addState(new StrengthState(10))
    const acceleration = attackerHelper.addState(new AccelerationState(1))
    const corrosion = new CorrosionState(1)
    defenderEnemy.addState(corrosion)

    const damages = action.calcDamages(attackerHelper.player, defenderEnemy)

    expect(damages.amount).toBe(30)
    expect(damages.count).toBe(4)
    expect(damages.attackerStates).toContain(strength)
    expect(damages.attackerStates).toContain(acceleration)
    expect(damages.defenderStates).toContain(corrosion)
  })

  it('硬い殻(20)があるとダメージが10に減少する', () => {
    const action = new TentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    const defenderEnemy = createEnemyWithStates()
    attackerHelper.addState(new StrengthState(10))
    attackerHelper.addState(new AccelerationState(1))
    const corrosion = new CorrosionState(1)
    const hardShell = new HardShellState(20)
    defenderEnemy.addState(corrosion)
    defenderEnemy.addState(hardShell)

    const damages = action.calcDamages(attackerHelper.player, defenderEnemy)

    expect(damages.amount).toBe(10)
    expect(damages.count).toBe(4)
    expect(damages.defenderStates).toContain(corrosion)
    expect(damages.defenderStates).toContain(hardShell)
  })

  it('防御側に加速があってもダメージ計算へは影響しない', () => {
    const action = new TentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    const defenderEnemy = createEnemyWithStates()
    const strength = attackerHelper.addState(new StrengthState(10))
    const acceleration = attackerHelper.addState(new AccelerationState(1))
    const corrosion = new CorrosionState(1)
    const hardShell = new HardShellState(20)
    const defenderAcceleration = new AccelerationState(2)
    defenderEnemy.addState(corrosion)
    defenderEnemy.addState(hardShell)
    defenderEnemy.addState(defenderAcceleration)

    const damages = action.calcDamages(attackerHelper.player, defenderEnemy)

    expect(damages.amount).toBe(10)
    expect(damages.count).toBe(4)
    expect(damages.defenderStates).toContain(corrosion)
    expect(damages.defenderStates).toContain(hardShell)
    expect(damages.defenderStates).not.toContain(defenderAcceleration)
  })

  it('単体攻撃はねばねばによる回数増加を受けない', () => {
    const action = new TackleAction()
    const attacker = createPlayerWithHand().player
    const sticky = new StickyState(1)
    const defenderEnemy = createEnemyWithStates([sticky])

    const damages = action.calcDamages(attacker, defenderEnemy)

    expect(damages.amount).toBe(20)
    expect(damages.count).toBe(1)
    expect(damages.defenderStates).not.toContain(sticky)
  })
})
