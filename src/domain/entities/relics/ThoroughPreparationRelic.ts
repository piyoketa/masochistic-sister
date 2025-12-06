import { Relic } from './Relic'

/**
 * 入念な準備：戦闘開始時の初期ドロー+2
 */
export class ThoroughPreparationRelic extends Relic {
  readonly id = 'thorough-preparation'
  readonly name = '入念な準備'
  readonly usageType = 'passive' as const
  readonly icon = '📝'
  private activated = false

  description(): string {
    return '戦闘開始時の初期ドロー枚数+1'
  }

  override isActive(context?: { battle?: import('@/domain/battle/Battle').Battle; player?: import('../Player').Player }): boolean {
    // プレイヤーの1ターン目のみ有効
    const battle = context?.battle
    const playerTurn = battle?.turn?.current.turnCount ?? 0
    return !this.activated && playerTurn <= 1
  }

  override onPlayerTurnStart(context: { battle: import('@/domain/battle/Battle').Battle; player: import('../Player').Player }): void {
    // ターン開始時に、1ターン目を過ぎたら非アクティブ扱いにする
    const turnCount = context.battle.turn.current.turnCount
    if (turnCount > 1) {
      this.activated = true
    }
  }

  override saveState(): unknown {
    return { activated: this.activated }
  }

  override restoreState(state: unknown): void {
    if (state && typeof state === 'object' && 'activated' in state) {
      this.activated = Boolean((state as { activated?: unknown }).activated)
    } else {
      this.activated = false
    }
  }
}
