import type { Battle } from '../battle/Battle'
import type { Player } from './Player'
import type { Enemy } from './Enemy'
import type { Card } from './Card'

export type OperationStatus = 'pending' | 'completed'

export interface OperationContext {
  battle: Battle
  player: Player
}

export interface CardOperation {
  type: string
  payload?: unknown
  status?: OperationStatus
}

export abstract class Operation<TResult = unknown> {
  readonly type: string
  protected statusValue: OperationStatus = 'pending'
  protected resultValue?: TResult

  protected constructor(type: string) {
    this.type = type
  }

  get status(): OperationStatus {
    return this.statusValue
  }

  isCompleted(): boolean {
    return this.statusValue === 'completed'
  }

  complete(payload: unknown, context: OperationContext): void {
    this.resultValue = this.resolve(payload, context)
    this.statusValue = 'completed'
  }

  protected abstract resolve(payload: unknown, context: OperationContext): TResult

  toMetadata(): Record<string, unknown> {
    return {}
  }
}

export class TargetEnemyOperation extends Operation<Enemy> {
  static readonly TYPE = 'target-enemy'

  constructor() {
    super(TargetEnemyOperation.TYPE)
  }

  protected resolve(payload: unknown, context: OperationContext): Enemy {
    const enemyId = this.extractEnemyId(payload)
    const enemy = context.battle.enemyTeam.findEnemyByNumericId(enemyId)
    if (!enemy) {
      throw new Error(`Enemy ${enemyId} not found`)
    }

    return enemy
  }

  private extractEnemyId(payload: unknown): number {
    if (typeof payload === 'number' && Number.isInteger(payload) && payload >= 0) {
      return payload
    }

    if (typeof payload === 'object' && payload !== null) {
      const value = (payload as { enemyId?: number; targetEnemyId?: number }).enemyId ??
        (payload as { targetEnemyId?: number }).targetEnemyId
      if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
        return value
      }
    }

    throw new Error('Operation requires a valid numeric enemy id')
  }

  override toMetadata(): Record<string, unknown> {
    const enemy = this.enemy
    const id = enemy.numericId
    if (id === undefined) {
      throw new Error('Enemy missing repository id')
    }

    return { targetEnemyId: id }
  }

  get enemy(): Enemy {
    if (!this.resultValue) {
      throw new Error('Operation not completed')
    }

    return this.resultValue
  }
}

export class SelectHandCardOperation extends Operation<Card> {
  static readonly TYPE = 'select-hand-card'

  constructor() {
    super(SelectHandCardOperation.TYPE)
  }

  protected resolve(payload: unknown, context: OperationContext): Card {
    const cardId = this.extractCardId(payload)
    const card = context.battle.hand.find(cardId)
    if (!card) {
      throw new Error(`Card ${cardId} not found in hand`)
    }

    return card
  }

  private extractCardId(payload: unknown): string {
    if (typeof payload === 'string') {
      return payload
    }

    if (typeof payload === 'object' && payload !== null) {
      const value = (payload as { cardId?: string }).cardId
      if (typeof value === 'string') {
        return value
      }
    }

    throw new Error('Operation requires a hand card id')
  }

  override toMetadata(): Record<string, unknown> {
    return {
      selectedHandCardId: this.card.id,
    }
  }

  get card(): Card {
    if (!this.resultValue) {
      throw new Error('Operation not completed')
    }

    return this.resultValue
  }
}
