import type { CardOperation } from '../entities/operations'
import type { Battle, BattleSnapshot } from './Battle'
import type { DamageOutcome } from '../entities/Damages'

type ValueFactory<T> = T | ((battle: Battle) => T)

export interface AnimationInstruction {
  snapshot: BattleSnapshot
  waitMs: number
  batchId: string
  metadata?: Record<string, unknown>
  damageOutcomes?: readonly DamageOutcome[]
}

type BaseActionLogEntry = {
  animations?: AnimationInstruction[]
}

export type BattleActionLogEntry =
  | ({ type: 'battle-start' } & BaseActionLogEntry)
  | ({ type: 'start-player-turn'; draw?: number; handOverflow?: boolean } & BaseActionLogEntry)
  | ({
      type: 'play-card'
      card: ValueFactory<number>
      operations?: Array<{
        type: CardOperation['type']
        payload?: ValueFactory<CardOperation['payload']>
      }>
    } & BaseActionLogEntry)
  | ({
      type: 'player-event'
      eventId: string
      payload?: unknown
    } & BaseActionLogEntry)
  | ({
      type: 'enemy-act'
      enemyId: number
      actionId?: string
      metadata?: Record<string, unknown>
    } & BaseActionLogEntry)
  | ({
      type: 'state-event'
      subject: 'player' | 'enemy'
      subjectId?: number
      stateId: string
      payload?: unknown
    } & BaseActionLogEntry)
  | ({ type: 'end-player-turn' } & BaseActionLogEntry)
  | ({ type: 'victory' } & BaseActionLogEntry)
  | ({ type: 'gameover' } & BaseActionLogEntry)

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
