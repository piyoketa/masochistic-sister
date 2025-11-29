import { Relic } from './Relic'

export class PureBodyRelic extends Relic {
  readonly id = 'pure-body'
  readonly name = '清廉な身体'
  readonly usageType = 'passive' as const
  readonly icon = '💧'
  private usedThisTurn = false

  description(): string {
    return 'ターン中１回まで、状態異常のコスト-1'
  }

  override isActive(): boolean {
    return !this.usedThisTurn
  }

  override onPlayerTurnStart(): void {
    this.usedThisTurn = false
  }

  markUsed(): void {
    this.usedThisTurn = true
  }

  override saveState(): unknown {
    return { usedThisTurn: this.usedThisTurn }
  }

  override restoreState(state: unknown): void {
    if (state && typeof state === 'object' && 'usedThisTurn' in state) {
      this.usedThisTurn = Boolean((state as { usedThisTurn?: unknown }).usedThisTurn)
    } else {
      this.usedThisTurn = false
    }
  }
}
