import { Relic } from './Relic'

/**
 * 暴力を許さず：天の鎖コスト軽減
 */
export class NoViolenceRelic extends Relic {
  readonly id = 'no-violence'
  readonly name = '暴力を許さず'
  readonly usageType = 'passive' as const
  readonly icon = '⛓️'
  private usedThisTurn = false

  description(): string {
    return 'ターン中１回まで、「天の鎖」のマナコストを０にする'
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
