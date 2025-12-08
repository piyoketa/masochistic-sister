import { Relic } from './Relic'

/**
 * 清廉な身体：状態異常解除のコストを軽減
 */
export class PureBodyRelic extends Relic {
  readonly id = 'pure-body'
  readonly name = '清廉'
  readonly usageType = 'passive' as const
  readonly icon = '💧'
  private usedThisTurn = false

  description(): string {
    return 'ターン中１回まで、状態異常解除のコスト-1'
  }

  override isActive(): boolean {
    return !this.usedThisTurn
  }

  override onPlayerTurnStart(): void {
    this.usedThisTurn = false
  }

  override costAdjustment(context?: {
    cardType?: import('../CardDefinition').CardDefinition['cardType']
  }): number {
    if (!this.isActive()) return 0
    if (context?.cardType === 'status') {
      return -1
    }
    return 0
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
