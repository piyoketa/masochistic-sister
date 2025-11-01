export type BattleEventType =
  | 'draw'
  | 'mana'
  | 'status'
  | 'custom'

export interface BattleEventPayload {
  [key: string]: unknown
}

export interface BattleEvent {
  id: string
  type: BattleEventType
  payload: BattleEventPayload
  scheduledTurn?: number
}

export class BattleEventQueue {
  private readonly events: BattleEvent[]

  constructor(initialEvents: BattleEvent[] = []) {
    this.events = [...initialEvents]
  }

  enqueue(event: BattleEvent): void {
    this.events.push(event)
    this.events.sort((a, b) => {
      const turnA = a.scheduledTurn ?? Number.MAX_SAFE_INTEGER
      const turnB = b.scheduledTurn ?? Number.MAX_SAFE_INTEGER
      if (turnA === turnB) {
        return a.id.localeCompare(b.id)
      }
      return turnA - turnB
    })
  }

  dequeue(): BattleEvent | undefined {
    return this.events.shift()
  }

  peek(): BattleEvent | undefined {
    return this.events[0]
  }

  list(): BattleEvent[] {
    return [...this.events]
  }

  clear(): void {
    this.events.length = 0
  }

  extractReady(turn: number): BattleEvent[] {
    const ready: BattleEvent[] = []
    const pending: BattleEvent[] = []

    for (const event of this.events) {
      const scheduledTurn = event.scheduledTurn ?? turn
      if (scheduledTurn <= turn) {
        ready.push(event)
      } else {
        pending.push(event)
      }
    }

    this.events.length = 0
    this.events.push(...pending)

    return ready
  }
}
