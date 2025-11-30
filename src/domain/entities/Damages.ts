/*
Damages.ts の責務:
- 攻撃ダメージのプリフェーズ（ヒット前計算）とポストフェーズ（ヒット後結果）の両方を一貫して保持し、状態異常による補正履歴を追跡する。
- 攻撃側／防御側が参照した State を記録し、演出や記憶カード生成時に利用できるよう補助情報を提供する。

責務ではないこと:
- 実際のダメージ適用やHP更新（Battle が担当）・ログ出力。ここでは値の算出と保存に特化する。

主要な通信相手とインターフェース:
- `Attack`: `calcDamages` で本クラスを生成し、`setOutcomes` / `registerPostHitState` を通じてヒット後情報を蓄積する。
- `State`: `modifyPreHit` / `onHitResolved` で参照され、適用された State を `Damages` に記録する。
- `MemoryManager`: 敵の攻撃を記憶カード化する際に、ここで算出したダメージプロファイルを複製する。
*/
import type { Battle } from '../battle/Battle'
import type { Attack } from './Action'
import type { Enemy } from './Enemy'
import type { Player } from './Player'
import type { State } from './State'

export type DamagePattern = 'single' | 'multi'
export type DamageEffectType = string

export interface DamageCalculationContext {
  battle?: Battle
  attack?: Attack
  attacker?: Player | Enemy
  defender?: Player | Enemy
}

export interface DamageCalculationParams {
  amount: number
  count: number
  type: DamagePattern
  role: 'attacker' | 'defender'
  context?: DamageCalculationContext
}

export interface DamageInitialization {
  baseAmount: number
  baseCount: number
  type: DamagePattern
  attackerStates?: State[]
  defenderStates?: State[]
  context?: DamageCalculationContext
}

export interface DamageOutcome {
  damage: number
  effectType: DamageEffectType
}

export class Damages {
  readonly baseAmount: number
  readonly baseCount: number
  readonly type: DamagePattern
  readonly attackerStates: readonly State[]
  readonly defenderStates: readonly State[]
  readonly amount: number
  readonly count: number

  private outcomesValue: readonly DamageOutcome[]
  private readonly postHitAttackerStates: Set<State>
  private readonly postHitDefenderStates: Set<State>

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

    const context = init.context

    let currentAmount = init.baseAmount
    let currentCount = init.baseCount

    const appliedAttacker: State[] = []
    for (const state of sortStatesByPriority(filterStatesWithModify(init.attackerStates))) {
      const beforeAmount = currentAmount
      const beforeCount = currentCount
      const result = state.modifyPreHit({
        amount: currentAmount,
        count: currentCount,
        type: this.type,
        role: 'attacker',
        context,
      })
      currentAmount = result.amount
      currentCount = result.count

      const didChange = beforeAmount !== currentAmount || beforeCount !== currentCount
      if (state.affectsAttacker() || didChange) {
        appliedAttacker.push(state)
      }
    }

    const appliedDefender: State[] = []
    for (const state of sortStatesByPriority(filterStatesWithModify(init.defenderStates))) {
      const beforeAmount = currentAmount
      const beforeCount = currentCount
      const result = state.modifyPreHit({
        amount: currentAmount,
        count: currentCount,
        type: this.type,
        role: 'defender',
        context,
      })
      currentAmount = result.amount
      currentCount = result.count

      const didChange = beforeAmount !== currentAmount || beforeCount !== currentCount
      if (state.affectsDefender() || didChange) {
        appliedDefender.push(state)
      }
    }

    const finalCount = Math.max(1, Math.floor(currentCount))
    const finalAmount = Math.max(0, Math.floor(currentAmount))

    this.amount = finalAmount
    this.count = finalCount
    this.attackerStates = Object.freeze(appliedAttacker)
    this.defenderStates = Object.freeze(appliedDefender)
    this.outcomesValue = Object.freeze([])
    this.postHitAttackerStates = new Set()
    this.postHitDefenderStates = new Set()
  }

  get outcomes(): readonly DamageOutcome[] {
    return this.outcomesValue
  }

  setOutcomes(outcomes: DamageOutcome[]): void {
    this.outcomesValue = Object.freeze(
      outcomes.map((outcome) =>
        Object.freeze({
          damage: Math.max(0, Math.floor(outcome.damage)),
          effectType: outcome.effectType,
        }),
      ),
    )
  }

  registerPostHitState(role: 'attacker' | 'defender', state: State): void {
    if (role === 'attacker') {
      this.postHitAttackerStates.add(state)
      return
    }
    this.postHitDefenderStates.add(state)
  }

  get postHitAttackerStateEffects(): readonly State[] {
    return Object.freeze(Array.from(this.postHitAttackerStates))
  }

  get postHitDefenderStateEffects(): readonly State[] {
    return Object.freeze(Array.from(this.postHitDefenderStates))
  }

  get totalPreHitDamage(): number {
    return this.amount * this.count
  }

  get totalPostHitDamage(): number {
    if (this.outcomesValue.length === 0) {
      return this.totalPreHitDamage
    }
    return this.outcomesValue.reduce((sum, outcome) => sum + outcome.damage, 0)
  }
}

function sortStatesByPriority(states?: State[]): State[] {
  if (!states || states.length === 0) {
    return []
  }
  return [...states].sort((a, b) => a.priority - b.priority)
}

function filterStatesWithModify(states?: State[]): State[] {
  if (!states || states.length === 0) {
    return []
  }
  return states.filter((state) => {
    const ok = typeof (state as State).modifyPreHit === 'function'
    if (!ok) {
      // eslint-disable-next-line no-console
      console.warn('[Damages] 無効なStateが含まれています', state)
    }
    return ok
  })
}
