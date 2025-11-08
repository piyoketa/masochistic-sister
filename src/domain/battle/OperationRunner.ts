import type { Battle } from './Battle'
import type { BattleActionLogEntry } from './ActionLog'
import { ActionLog } from './ActionLog'

interface OperationRunnerConfig {
  battle: Battle
  actionLog?: ActionLog
  turnDrawPlan?: number[]
  defaultDrawCount?: number
  onEntryAppended?: (entry: BattleActionLogEntry, index: number) => void
}

interface AppendOptions {
  suppressFlush?: boolean
}

type PlayCardOperations = Extract<
  BattleActionLogEntry,
  { type: 'play-card' }
>['operations']

export class OperationRunner {
  private readonly battle: Battle
  private readonly actionLog: ActionLog
  private readonly drawPlan: number[]
  private readonly defaultDrawCount: number
  private readonly onEntryAppended?: (entry: BattleActionLogEntry, index: number) => void

  private initialized = false
  private nextDrawIndex = 0
  private recordedOutcome?: Battle['status']

  constructor(config: OperationRunnerConfig) {
    this.battle = config.battle
    this.actionLog = config.actionLog ?? new ActionLog()
    this.drawPlan = [...(config.turnDrawPlan ?? [])]
    this.defaultDrawCount = config.defaultDrawCount ?? 5
    this.onEntryAppended = config.onEntryAppended
  }

  getActionLog(): ActionLog {
    return this.actionLog
  }

  initializeIfNeeded(): void {
    if (this.initialized) {
      return
    }

    this.initialized = true
    this.appendEntry({ type: 'battle-start' })
    this.appendStartPlayerTurn()
  }

  playCard(cardId: number, operations?: PlayCardOperations): number {
    this.initializeIfNeeded()
    return this.appendEntry({
      type: 'play-card',
      card: cardId,
      operations,
    })
  }

  endPlayerTurn(): number {
    this.initializeIfNeeded()
    const index = this.appendEntry({ type: 'end-player-turn' }, { suppressFlush: true })
    this.flushResolvedEvents()
    this.appendEnemyActEntries()
    this.flushStateEvents()
    this.appendBattleOutcomeIfNeeded()
    if (this.battle.status === 'in-progress') {
      this.appendStartPlayerTurn()
    }
    return index
  }

  private appendStartPlayerTurn(): number {
    const draw = this.getNextDrawCount()
    return this.appendEntry({
      type: 'start-player-turn',
      draw: draw > 0 ? draw : undefined,
    })
  }

  private appendEntry(entry: BattleActionLogEntry, options?: AppendOptions): number {
    const index = this.actionLog.push(entry)
    this.battle.executeActionLog(this.actionLog, index)

    if (!options?.suppressFlush) {
      this.flushResolvedEvents()
      this.flushStateEvents()
      this.appendBattleOutcomeIfNeeded()
    }

    this.onEntryAppended?.(entry, index)
    return index
  }

  private flushResolvedEvents(): void {
    const events = this.battle.consumeResolvedEvents()
    if (events.length === 0) {
      return
    }

    for (const event of events) {
      this.appendEntry(
        {
          type: 'player-event',
          eventId: event.id,
          payload: {
            type: event.type,
            payload: event.payload,
            scheduledTurn: event.scheduledTurn,
          },
        },
        { suppressFlush: true },
      )
    }
  }

  private flushStateEvents(): void {
    const stateEvents = this.battle.consumeStateEvents()
    if (stateEvents.length === 0) {
      return
    }

    for (const event of stateEvents) {
      this.appendEntry(
        {
          type: 'state-event',
          subject: event.subject,
          subjectId: event.subjectId,
          stateId: event.stateId,
          payload: event.payload,
        },
        { suppressFlush: true },
      )
    }
  }

  private appendEnemyActEntries(): void {
    const summary = this.battle.getLastEnemyTurnSummary()
    if (!summary) {
      return
    }

    for (const action of summary.actions) {
      this.appendEntry(
        {
          type: 'enemy-act',
          enemyId: action.enemyId,
          actionId: action.actionName,
          metadata: action,
        },
        { suppressFlush: true },
      )
    }
  }

  private appendBattleOutcomeIfNeeded(): void {
    const status = this.battle.status
    if (status === 'in-progress' || this.recordedOutcome === status) {
      return
    }

    if (status === 'victory' || status === 'gameover') {
      this.appendEntry({ type: status }, { suppressFlush: true })
      this.recordedOutcome = status
    }
  }

  private getNextDrawCount(): number {
    if (this.drawPlan.length === 0) {
      return this.defaultDrawCount
    }

    if (this.nextDrawIndex < this.drawPlan.length) {
      const value = this.drawPlan[this.nextDrawIndex]
      this.nextDrawIndex += 1
      return value ?? this.defaultDrawCount
    }

    this.nextDrawIndex += 1
    return this.drawPlan[this.drawPlan.length - 1] ?? this.defaultDrawCount
  }
}
