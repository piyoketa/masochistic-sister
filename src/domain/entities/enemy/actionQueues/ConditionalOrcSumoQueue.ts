import type { Action } from '../../Action/ActionBase'
import { DefaultEnemyActionQueue } from './DefaultEnemyActionQueue'
import { FattenAction } from '../../actions/FattenAction'
import { BattleDanceAction } from '../../actions/BattleDanceAction'

type QueueContext = {
  battle?: import('../../../battle/Battle').Battle
}

/**
 * オーク力士専用: プレイヤーが「重量化」を持っている場合、太らせるの代わりに戦いの舞いを選択する。
 */
export class ConditionalOrcSumoQueue extends DefaultEnemyActionQueue {
  private readonly battleDance: BattleDanceAction

  constructor() {
    super()
    this.battleDance = new BattleDanceAction()
  }

  override setContext(context: Record<string, unknown>): void {
    super.setContext(context)
  }

  protected override pickActionForTurn(turn: number): Action | undefined {
    const picked = super.pickActionForTurn(turn)
    if (!picked) {
      return picked
    }
    const battle = this.getContext()?.battle
    const playerStates = battle?.player.getStates(battle)
    const playerHasHeavyweight = playerStates?.some((state) => state.id === 'state-heavyweight') ?? false
    if (playerHasHeavyweight && picked instanceof FattenAction) {
      // 戦いの舞いを候補に持っている場合はそちらを使う。無ければデフォルトの行動を使う。
      const alternative = this.actions.find((action) => action instanceof BattleDanceAction) ?? this.battleDance
      return alternative
    }
    return picked
  }

  private getContext(): QueueContext | undefined {
    // EnemyActionQueue で保持している context を安全に取り出すためのユーティリティ
    return (this as unknown as { context?: QueueContext }).context
  }
}
