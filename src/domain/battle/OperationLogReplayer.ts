import { ActionLog } from './ActionLog'
import type { BattleActionLogEntry } from './ActionLog'
import { ActionLogReplayer } from './ActionLogReplayer'
import type { Battle } from './Battle'
import { OperationRunner } from './OperationRunner'
import type { OperationLogEntry } from './OperationLog'
import { OperationLog } from './OperationLog'

export interface OperationLogReplayerConfig {
  createBattle: () => Battle
  operationLog: OperationLog
  turnDrawPlan?: number[]
  defaultDrawCount?: number
  onEntryAppended?: (entry: BattleActionLogEntry, index: number) => void
  onOperationApplied?: (params: {
    operation: OperationLogEntry
    operationIndex: number
    actionLogIndex: number
  }) => void
}

export interface OperationLogReplayResult {
  battle: Battle
  snapshot: ReturnType<Battle['getSnapshot']>
  actionLog: ActionLog
  initialSnapshot: ReturnType<Battle['getSnapshot']>
}

export class OperationLogReplayer {
  private readonly createBattle: () => Battle
  private readonly operationLog: OperationLog
  private readonly turnDrawPlan?: number[]
  private readonly defaultDrawCount?: number
  private readonly onEntryAppended?: OperationLogReplayerConfig['onEntryAppended']
  private readonly onOperationApplied?: OperationLogReplayerConfig['onOperationApplied']

  constructor(config: OperationLogReplayerConfig) {
    this.createBattle = config.createBattle
    this.operationLog = config.operationLog
    this.turnDrawPlan = config.turnDrawPlan
    this.defaultDrawCount = config.defaultDrawCount
    this.onEntryAppended = config.onEntryAppended
    this.onOperationApplied = config.onOperationApplied
  }

  buildActionLog(): OperationLogReplayResult {
    const battle = this.createBattle()
    const actionLog = new ActionLog()
    const runner = new OperationRunner({
      battle,
      actionLog,
      turnDrawPlan: this.turnDrawPlan,
      defaultDrawCount: this.defaultDrawCount,
      onEntryAppended: this.onEntryAppended,
    })

    const initialSnapshot = battle.getSnapshot()

    runner.initializeIfNeeded()

    for (let index = 0; index < this.operationLog.length; index += 1) {
      const operation = this.operationLog.at(index)
      if (!operation) {
        continue
      }

      switch (operation.type) {
        case 'play-card': {
          const cardId = this.operationLog.resolveValue(operation.card, battle)
          const resolvedOperations =
            operation.operations?.map((op) => ({
              type: op.type,
              payload:
                op.payload === undefined ? undefined : this.operationLog.resolveValue(op.payload, battle),
            })) ?? undefined
          const actionLogIndex = runner.playCard(cardId, resolvedOperations)
          this.onOperationApplied?.({
            operation,
            operationIndex: index,
            actionLogIndex,
          })
          break
        }
        case 'end-player-turn': {
          const actionLogIndex = runner.endPlayerTurn()
          this.onOperationApplied?.({
            operation,
            operationIndex: index,
            actionLogIndex,
          })
          break
        }
        default: {
          const exhaustiveCheck: never = operation
          throw new Error(`Unsupported operation type: ${(exhaustiveCheck as { type: string }).type}`)
        }
      }
    }

    const snapshot = battle.getSnapshot()

    return { battle, snapshot, initialSnapshot, actionLog }
  }

  toActionLogReplayer(actionLog: ActionLog): ActionLogReplayer {
    return new ActionLogReplayer({
      createBattle: this.createBattle,
      actionLog,
    })
  }
}
