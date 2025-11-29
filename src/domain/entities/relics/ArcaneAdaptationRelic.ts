import { Relic } from './Relic'

/**
 * 魔への順応：被虐のオーラのコストを削減
 */
export class ArcaneAdaptationRelic extends Relic {
  readonly id = 'arcane-adaptation'
  readonly name = '魔への順応'
  readonly usageType = 'passive' as const
  readonly icon = '👿'
  private usedThisTurn = false

  description(): string {
    return 'ターン中１回まで、「被虐のオーラ」のマナコストを０にする'
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
