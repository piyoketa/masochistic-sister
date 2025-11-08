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

  startPlayerTurn(): void {
    const turnCount = this.state.activeSide === 'enemy' ? this.state.turnCount + 1 : this.state.turnCount
    this.state = {
      turnCount,
      activeSide: 'player',
      phase: 'player-draw',
    }
  }

  moveToPhase(phase: TurnPhase): void {
    this.state = {
      ...this.state,
      phase,
    }
  }

  startEnemyTurn(): void {
    this.state = {
      turnCount: this.state.turnCount,
      activeSide: 'enemy',
      phase: 'enemy',
    }
  }

  advanceTurn(): void {
    this.state = {
      turnCount: this.state.turnCount + 1,
      activeSide: 'player',
      phase: 'player-draw',
    }
  }

  setState(state: TurnState): void {
    this.state = { ...state }
  }
}
