export type TurnPhase =
  | 'player-draw'
  | 'player-main'
  | 'player-end'
  | 'enemy'

export interface TurnState {
  turnCount: number
  activeSide: 'player' | 'enemy'
  phase: TurnPhase
}

export class TurnManager {
  private state: TurnState

  constructor(initialState?: TurnState) {
    this.state = initialState ?? {
      turnCount: 1,
      activeSide: 'player',
      phase: 'player-draw',
    }
  }

  get current(): TurnState {
    return this.state
  }

  startPlayerTurn(): void {}

  moveToPhase(phase: TurnPhase): void {}

  startEnemyTurn(): void {}

  advanceTurn(): void {}
}
