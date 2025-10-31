import { describe, it, expect } from 'vitest'

import { TentacleFlurryAction } from '@/domain/entities/actions/TentacleFlurryAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import {
  StrengthState,
  AccelerationState,
  CorrosionState,
  HardShellState,
} from '@/domain/entities/states'

describe('Attack#calcDamagesの挙動', () => {
  it('筋力や状態が無い場合は10ダメージ×3回になる', () => {
    const action = new TentacleFlurryAction()
    const attacker = new ProtagonistPlayer()
    const defender = new ProtagonistPlayer()

    const damages = action.calcDamages(attacker, defender)

    expect(damages.amount).toBe(10)
    expect(damages.count).toBe(3)
    expect(damages.type).toBe('multi')
    expect(damages.attackerStates).toHaveLength(0)
    expect(damages.defenderStates).toHaveLength(0)
  })

  it('攻撃側に筋力上昇(10)があるとダメージが20に増える', () => {
    const action = new TentacleFlurryAction()
    const attacker = new ProtagonistPlayer()
    const defender = new ProtagonistPlayer()
    const strength = new StrengthState(10)
    attacker.addState(strength)

    const damages = action.calcDamages(attacker, defender)

    expect(damages.amount).toBe(20)
    expect(damages.count).toBe(3)
    expect(damages.attackerStates).toContain(strength)
  })

  it('攻撃側の筋力上昇と防御側の腐食が重なるとダメージが30になる', () => {
    const action = new TentacleFlurryAction()
    const attacker = new ProtagonistPlayer()
    const defender = new ProtagonistPlayer()
    const strength = new StrengthState(10)
    const corrosion = new CorrosionState(1)
    attacker.addState(strength)
    defender.addState(corrosion)

    const damages = action.calcDamages(attacker, defender)

    expect(damages.amount).toBe(30)
    expect(damages.count).toBe(3)
    expect(damages.attackerStates).toContain(strength)
    expect(damages.defenderStates).toContain(corrosion)
  })

  it('筋力上昇と加速、腐食が揃うとダメージ30の4回攻撃になる', () => {
    const action = new TentacleFlurryAction()
    const attacker = new ProtagonistPlayer()
    const defender = new ProtagonistPlayer()
    const strength = new StrengthState(10)
    const acceleration = new AccelerationState(1)
    const corrosion = new CorrosionState(1)
    attacker.addState(strength)
    attacker.addState(acceleration)
    defender.addState(corrosion)

    const damages = action.calcDamages(attacker, defender)

    expect(damages.amount).toBe(30)
    expect(damages.count).toBe(4)
    expect(damages.attackerStates).toContain(strength)
    expect(damages.attackerStates).toContain(acceleration)
    expect(damages.defenderStates).toContain(corrosion)
  })

  it('硬い殻(20)があるとダメージが10に減少する', () => {
    const action = new TentacleFlurryAction()
    const attacker = new ProtagonistPlayer()
    const defender = new ProtagonistPlayer()
    const strength = new StrengthState(10)
    const acceleration = new AccelerationState(1)
    const corrosion = new CorrosionState(1)
    const hardShell = new HardShellState(20)
    attacker.addState(strength)
    attacker.addState(acceleration)
    defender.addState(corrosion)
    defender.addState(hardShell)

    const damages = action.calcDamages(attacker, defender)

    expect(damages.amount).toBe(10)
    expect(damages.count).toBe(4)
    expect(damages.defenderStates).toContain(corrosion)
    expect(damages.defenderStates).toContain(hardShell)
  })

  it('防御側に加速があってもダメージ計算へは影響しない', () => {
    const action = new TentacleFlurryAction()
    const attacker = new ProtagonistPlayer()
    const defender = new ProtagonistPlayer()
    const strength = new StrengthState(10)
    const acceleration = new AccelerationState(1)
    const corrosion = new CorrosionState(1)
    const hardShell = new HardShellState(20)
    const defenderAcceleration = new AccelerationState(2)
    attacker.addState(strength)
    attacker.addState(acceleration)
    defender.addState(corrosion)
    defender.addState(hardShell)
    defender.addState(defenderAcceleration)

    const damages = action.calcDamages(attacker, defender)

    expect(damages.amount).toBe(10)
    expect(damages.count).toBe(4)
    expect(damages.defenderStates).toContain(corrosion)
    expect(damages.defenderStates).toContain(hardShell)
    expect(damages.defenderStates).not.toContain(defenderAcceleration)
  })
})
