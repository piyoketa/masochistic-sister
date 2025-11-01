import type { State } from './State'

export type DamagePattern = 'single' | 'multi'

export interface DamageCalculationParams {
  amount: number
  count: number
  role: 'attacker' | 'defender'
}

export interface DamageInitialization {
  baseAmount: number
  baseCount: number
  type: DamagePattern
  attackerStates?: State[]
  defenderStates?: State[]
}

export class Damages {
  readonly baseAmount: number
  readonly baseCount: number
  readonly amount: number
  readonly count: number
  readonly type: DamagePattern
  readonly attackerStates: readonly State[]
  readonly defenderStates: readonly State[]

  constructor(init: DamageInitialization) {
    if (!Number.isFinite(init.baseAmount) || init.baseAmount < 0) {
      throw new Error(`Damage amount must be a non-negative finite number, received: ${init.baseAmount}`)
    }

    if (!Number.isFinite(init.baseCount) || init.baseCount <= 0) {
      throw new Error(`Damage count must be a positive finite number, received: ${init.baseCount}`)
    }

    this.baseAmount = init.baseAmount
    this.baseCount = init.baseCount
    this.type = init.type

    let currentAmount = init.baseAmount
    let currentCount = init.baseCount

    const appliedAttacker: State[] = []
    for (const state of init.attackerStates ?? []) {
      const beforeAmount = currentAmount
      const beforeCount = currentCount
      const result = state.modifyDamage({ amount: currentAmount, count: currentCount, role: 'attacker' })
      currentAmount = result.amount
      currentCount = result.count

      if (state.affectsAttacker() || beforeAmount !== currentAmount || beforeCount !== currentCount) {
        appliedAttacker.push(state)
      }
    }

    const appliedDefender: State[] = []
    for (const state of init.defenderStates ?? []) {
      const beforeAmount = currentAmount
      const beforeCount = currentCount
      const result = state.modifyDamage({ amount: currentAmount, count: currentCount, role: 'defender' })
      currentAmount = result.amount
      currentCount = result.count

      if (state.affectsDefender() || beforeAmount !== currentAmount || beforeCount !== currentCount) {
        appliedDefender.push(state)
      }
    }

    const finalCount = Math.max(1, Math.floor(currentCount))
    const finalAmount = Math.max(0, Math.floor(currentAmount))

    this.amount = finalAmount
    this.count = finalCount
    this.attackerStates = Object.freeze(appliedAttacker)
    this.defenderStates = Object.freeze(appliedDefender)
  }

}
