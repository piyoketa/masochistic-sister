export interface BattleLogEntry {
  id: string
  message: string
  turn: number
  timestamp: Date
  metadata?: Record<string, unknown>
}

export class BattleLog {
  private readonly entries: BattleLogEntry[]

  constructor(initialEntries: BattleLogEntry[] = []) {
    this.entries = [...initialEntries]
  }

  record(entry: BattleLogEntry): void {}

  list(): BattleLogEntry[] {
    return [...this.entries]
  }

  clear(): void {}
}
