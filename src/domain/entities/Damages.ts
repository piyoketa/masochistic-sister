import type { State } from './State'

export type DamagePattern = 'single' | 'multi'

export interface DamagesProps {
  type: DamagePattern
  amount: number
  count: number
  attackerStates?: State[]
  defenderStates?: State[]
}

export class Damages {
  readonly type: DamagePattern
  readonly amount: number
  readonly count: number
  readonly attackerStates: readonly State[]
  readonly defenderStates: readonly State[]

  constructor(props: DamagesProps) {
    if (!Number.isFinite(props.amount) || props.amount < 0) {
      throw new Error(`Damage amount must be a non-negative finite number, received: ${props.amount}`)
    }

    if (!Number.isInteger(props.count) || props.count <= 0) {
      throw new Error(`Damage count must be a positive integer, received: ${props.count}`)
    }

    this.type = props.type
    this.amount = props.amount
    this.count = props.count
    this.attackerStates = Object.freeze([...(props.attackerStates ?? [])])
    this.defenderStates = Object.freeze([...(props.defenderStates ?? [])])
  }

  static single(amount: number): Damages {
    return new Damages({
      type: 'single',
      amount,
      count: 1,
    })
  }

  static multi(amount: number, count: number): Damages {
    return new Damages({
      type: count > 1 ? 'multi' : 'single',
      amount,
      count: Math.max(1, count),
    })
  }
}
