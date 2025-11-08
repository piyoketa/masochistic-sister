import type { CardOperation } from '../entities/operations'
import type { Battle } from './Battle'

type ValueFactory<T> = T | ((battle: Battle) => T)

export type BattleActionLogEntry =
  | { type: 'battle-start' }
  | { type: 'start-player-turn'; draw?: number; handOverflow?: boolean }
  | {
      type: 'play-card'
      card: ValueFactory<number>
      operations?: Array<{
        type: CardOperation['type']
        payload?: ValueFactory<CardOperation['payload']>
      }>
    }
  | {
      type: 'player-event'
      eventId: string
      payload?: unknown
    }
  | {
      type: 'enemy-act'
      enemyId: number
      actionId?: string
      metadata?: Record<string, unknown>
    }
  | {
      type: 'state-event'
      subject: 'player' | 'enemy'
      subjectId?: number
      stateId: string
      payload?: unknown
    }
  | { type: 'end-player-turn' }
  | { type: 'victory' }
  | { type: 'gameover' }

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

  truncateAfter(index: number): void {
    const keepLength = index >= 0 ? index + 1 : 0
    if (keepLength >= this.entries.length) {
      return
    }

    if (keepLength <= 0) {
      this.entries.length = 0
      return
    }

    this.entries.length = keepLength
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
