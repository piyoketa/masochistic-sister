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

  enqueue(event: BattleEvent): void {}

  dequeue(): BattleEvent | undefined {
    return undefined
  }

  peek(): BattleEvent | undefined {
    return this.events[0]
  }

  list(): BattleEvent[] {
    return [...this.events]
  }

  clear(): void {}
}
