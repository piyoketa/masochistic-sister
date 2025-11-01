import type { CardOperation } from '../entities/operations'
import type { Battle } from './Battle'

type ValueFactory<T> = T | ((battle: Battle) => T)

export type BattleActionLogEntry =
  | { type: 'battle-start' }
  | { type: 'start-player-turn'; draw?: number }
  | { type: 'draw'; count: number }
  | {
    type: 'play-card'
    card: ValueFactory<number>
    operations?: Array<{
      type: CardOperation['type']
      payload?: ValueFactory<CardOperation['payload']>
    }>
  }
  | { type: 'end-player-turn' }
  | { type: 'start-enemy-turn' }
  | { type: 'enemy-action'; enemy: ValueFactory<number> }

export class ActionLog {
  private readonly entries: BattleActionLogEntry[] = []

  constructor(initialEntries?: BattleActionLogEntry[]) {
    if (initialEntries) {
      initialEntries.forEach((entry) => this.push(entry))
    }
  }

  push(entry: BattleActionLogEntry): number {
    this.entries.push(entry)
    return this.entries.length - 1
  }

  at(index: number): BattleActionLogEntry | undefined {
    return this.entries[index]
  }

  toArray(): BattleActionLogEntry[] {
    return [...this.entries]
  }

  slice(endInclusive: number): BattleActionLogEntry[] {
    if (endInclusive < 0) {
      return []
    }

    return this.entries.slice(0, endInclusive + 1)
  }

  get length(): number {
    return this.entries.length
  }

  resolveValue<T>(value: ValueFactory<T>, battle: Battle): T {
    if (typeof value === 'function') {
      return (value as (context: Battle) => T)(battle)
    }

    return value
  }
}

export type { ValueFactory }
