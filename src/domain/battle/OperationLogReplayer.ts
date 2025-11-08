import { ActionLog } from './ActionLog'
import type { BattleActionLogEntry } from './ActionLog'
import { ActionLogReplayer } from './ActionLogReplayer'
import type { Battle, FullBattleSnapshot } from './Battle'
import { OperationRunner, OperationRunnableError } from './OperationRunner'
import type { OperationLogEntry } from './OperationLog'
import { OperationLog } from './OperationLog'

export interface OperationLogReplayerConfig {
  createBattle: () => Battle
  operationLog: OperationLog
  onEntryAppended?: (entry: BattleActionLogEntry, context: { index: number; waitMs: number; groupId?: string }) => void
  onOperationApplied?: (params: {
    operation: OperationLogEntry
    operationIndex: number
    actionLogIndex: number
  }) => void
}

export interface OperationLogReplayResult {
  battle: Battle
  actionLog: ActionLog
  initialSnapshot: FullBattleSnapshot
  finalSnapshot: FullBattleSnapshot
}

export class OperationLogReplayer {
  private readonly createBattle: () => Battle
  private readonly operationLog: OperationLog
  private readonly onEntryAppended?: OperationLogReplayerConfig['onEntryAppended']
  private readonly onOperationApplied?: OperationLogReplayerConfig['onOperationApplied']

  constructor(config: OperationLogReplayerConfig) {
    this.createBattle = config.createBattle
    this.operationLog = config.operationLog
    this.onEntryAppended = config.onEntryAppended
    this.onOperationApplied = config.onOperationApplied
  }

  buildActionLog(): OperationLogReplayResult {
    const battle = this.createBattle()
    const actionLog = new ActionLog()
    const initialSnapshot = battle.captureFullSnapshot()

    const runner = new OperationRunner({
      battle,
      actionLog,
      initialSnapshot,
      onEntryAppended: this.onEntryAppended,
    })

    runner.initializeIfNeeded()

    for (let index = 0; index < this.operationLog.length; index += 1) {
      const operation = this.operationLog.at(index)
      if (!operation) {
        continue
      }

      try {
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
      } catch (error) {
        if (error instanceof OperationRunnableError) {
          throw new OperationRunnableError(error.message, {
            actionEntry: error.actionEntry,
            cause: error.cause,
            operationIndex: index,
          })
        }
        throw error
      }
    }

    const finalSnapshot = battle.captureFullSnapshot()

    return { battle, actionLog, initialSnapshot, finalSnapshot }
  }

  toActionLogReplayer(actionLog: ActionLog): ActionLogReplayer {
    return new ActionLogReplayer({
      createBattle: this.createBattle,
      actionLog,
    })
  }
}
