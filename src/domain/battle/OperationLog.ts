import type { CardOperation } from '../entities/operations'
import type { ValueFactory } from './ActionLog'
import type { Battle } from './Battle'
import type { RelicId } from '../entities/relics/relicTypes'

export type OperationLogEntry =
  | {
      type: 'play-card'
      card: ValueFactory<number>
      operations?: Array<{
        type: CardOperation['type']
        payload?: ValueFactory<CardOperation['payload']>
      }>
    }
  | {
      type: 'play-relic'
      relicId: ValueFactory<RelicId>
      operations?: Array<{
        type: CardOperation['type']
        payload?: ValueFactory<CardOperation['payload']>
      }>
    }
  | { type: 'end-player-turn' }

export class OperationLog {
  private readonly entries: OperationLogEntry[] = []

  constructor(initialEntries?: OperationLogEntry[]) {
    if (initialEntries) {
      initialEntries.forEach((entry) => this.push(entry))
    }
  }

  push(entry: OperationLogEntry): number {
    this.entries.push(entry)
    return this.entries.length - 1
  }

  at(index: number): OperationLogEntry | undefined {
    return this.entries[index]
  }

  toArray(): OperationLogEntry[] {
    return [...this.entries]
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

export type { OperationLogEntry as OperationLogEntryType }
