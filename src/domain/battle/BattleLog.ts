export interface BattleLogEntry {
  id: string
  message: string
  turn: number
  timestamp: Date
  metadata?: Record<string, unknown>
}

export class BattleLog {
  private readonly entries: BattleLogEntry[]
  private sequence = 0

  constructor(initialEntries: BattleLogEntry[] = []) {
    this.entries = [...initialEntries]
  }

  record(entry: BattleLogEntry): void {
    this.entries.push(entry)
    this.sequence += 1
  }

  list(): BattleLogEntry[] {
    return [...this.entries]
  }

  clear(): void {
    this.entries.length = 0
    this.sequence = 0
  }

  replace(entries: BattleLogEntry[]): void {
    this.entries.length = 0
    this.entries.push(...entries)
    this.sequence = entries.length
  }
}
