import type {
  Battle,
  BattleSnapshot,
  FullBattleSnapshot,
  PlayCardAnimationContext,
} from './Battle'
import type { AnimationInstruction, BattleActionLogEntry } from './ActionLog'
import { ActionLog } from './ActionLog'
import type { Card } from '../entities/Card'
import type { DamageOutcome } from '../entities/Damages'

export interface EntryAppendContext {
  index: number
  waitMs: number
  groupId?: string
}

export interface OperationRunnerConfig {
  battle: Battle
  actionLog?: ActionLog
  initialSnapshot?: FullBattleSnapshot
  onEntryAppended?: (entry: BattleActionLogEntry, context: EntryAppendContext) => void
}

interface AppendOptions {
  suppressFlush?: boolean
}

export interface OperationRunnableErrorOptions {
  actionEntry?: BattleActionLogEntry
  operationIndex?: number
  cause?: unknown
}

export class OperationRunnableError extends Error {
  public readonly actionEntry?: BattleActionLogEntry
  public readonly operationIndex?: number
  public readonly cause?: unknown

  constructor(message: string, options: OperationRunnableErrorOptions = {}) {
    super(message)
    this.name = 'OperationRunnableError'
    this.actionEntry = options.actionEntry
    this.operationIndex = options.operationIndex
    this.cause = options.cause
  }
}

type PlayCardOperations = Extract<
  BattleActionLogEntry,
  { type: 'play-card' }
>['operations']

export class OperationRunner {
  private readonly battle: Battle
  private readonly actionLog: ActionLog
  private readonly onEntryAppended?: (entry: BattleActionLogEntry, context: EntryAppendContext) => void
  private readonly initialSnapshot: FullBattleSnapshot

  private initialized = false
  private recordedOutcome?: Battle['status']
  private enemyActGroupCounter = 0

  constructor(config: OperationRunnerConfig) {
    this.battle = config.battle
    this.actionLog = config.actionLog ?? new ActionLog()
    this.onEntryAppended = config.onEntryAppended
    if (config.initialSnapshot) {
      this.initialSnapshot = config.initialSnapshot
      this.battle.restoreFullSnapshot(config.initialSnapshot)
    } else {
      this.initialSnapshot = this.battle.captureFullSnapshot()
    }
  }

  getActionLog(): ActionLog {
    return this.actionLog
  }

  getInitialSnapshot(): FullBattleSnapshot {
    return this.initialSnapshot
  }

  captureSnapshot(): FullBattleSnapshot {
    return this.battle.captureFullSnapshot()
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
    const draw = this.calculateTurnStartDraw()
    return this.appendEntry({
      type: 'start-player-turn',
      draw: draw > 0 ? draw : undefined,
    })
  }

  private appendEntry(entry: BattleActionLogEntry, options?: AppendOptions): number {
    let index = -1
    const shouldCaptureAnimations = entry.type === 'play-card'
    const snapshotBefore = shouldCaptureAnimations ? this.battle.captureFullSnapshot() : undefined
    try {
      index = this.actionLog.push(entry)
      this.battle.executeActionLog(this.actionLog, index)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new OperationRunnableError(message, { actionEntry: entry, cause: error })
    }

    if (shouldCaptureAnimations && snapshotBefore) {
      const appendedEntry = this.actionLog.at(index)
      if (appendedEntry && appendedEntry.type === 'play-card') {
        const snapshotAfter = this.battle.captureFullSnapshot()
        this.attachPlayCardAnimations(appendedEntry, snapshotBefore.snapshot, snapshotAfter.snapshot)
      }
    }

    if (!options?.suppressFlush) {
      this.flushResolvedEvents()
      this.flushStateEvents()
      this.appendBattleOutcomeIfNeeded()
    }

    this.emitEntryAppended(entry, index)
    return index
  }

  private emitEntryAppended(entry: BattleActionLogEntry, index: number): void {
    if (!this.onEntryAppended) {
      return
    }
    const waitInfo = this.getWaitInfo(entry)
    this.onEntryAppended(entry, { index, ...waitInfo })
  }

  private getWaitInfo(entry: BattleActionLogEntry): { waitMs: number; groupId?: string } {
    switch (entry.type) {
      case 'enemy-act':
        return {
          waitMs: 500,
          groupId: `enemy-act:${entry.enemyId}:${this.enemyActGroupCounter++}`,
        }
      case 'player-event':
      case 'state-event':
        return { waitMs: 200 }
      default:
        return { waitMs: 0 }
    }
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

  private attachPlayCardAnimations(
    entry: Extract<BattleActionLogEntry, { type: 'play-card' }>,
    before: BattleSnapshot,
    after: BattleSnapshot,
  ): void {
    const context = this.battle.consumeLastPlayCardAnimationContext()
    entry.animations = this.buildPlayCardAnimations(before, after, context)
  }

  private buildPlayCardAnimations(
    before: BattleSnapshot,
    after: BattleSnapshot,
    context?: PlayCardAnimationContext,
  ): AnimationInstruction[] {
    const animations: AnimationInstruction[] = []
    const cardMoveSnapshot =
      context?.cardId !== undefined
        ? this.buildCardMoveSnapshot(before, after, context.cardId)
        : this.cloneBattleSnapshot(after)

    animations.push({
      snapshot: cardMoveSnapshot,
      waitMs: 0,
      metadata: {
        stage: 'card-move',
        cardId: context?.cardId,
      },
    })

    const damageSnapshot = this.buildDamageSnapshot(before, after, context)
    animations.push({
      snapshot: damageSnapshot,
      waitMs: this.calculateDamageWait(context),
      metadata: {
        stage: 'damage',
        cardId: context?.cardId,
        defeatedEnemyIds: context?.defeatedEnemyIds ?? [],
      },
      damageOutcomes: this.extractDamageOutcomes(context),
    })

    if ((context?.defeatedEnemyIds?.length ?? 0) > 0) {
      animations.push({
        snapshot: this.cloneBattleSnapshot(after),
        waitMs: 1000,
        metadata: {
          stage: 'defeat',
          cardId: context?.cardId,
          defeatedEnemyIds: context?.defeatedEnemyIds ?? [],
        },
      })
    }

    return animations
  }

  private buildCardMoveSnapshot(before: BattleSnapshot, after: BattleSnapshot, cardId: number): BattleSnapshot {
    const snapshot = this.cloneBattleSnapshot(before)
    const destination = this.determineCardDestination(after, cardId)
    const cardInstance =
      this.findCardById(after.hand, cardId) ??
      this.findCardById(after.discardPile, cardId) ??
      this.findCardById(after.exilePile, cardId)

    this.removeCardFromAllZones(snapshot, cardId)

    if (cardInstance) {
      if (destination === 'discard') {
        snapshot.discardPile = [...snapshot.discardPile, cardInstance]
      } else if (destination === 'exile') {
        snapshot.exilePile = [...snapshot.exilePile, cardInstance]
      } else if (destination === 'hand') {
        snapshot.hand = [...snapshot.hand, cardInstance]
      }
    }

    return snapshot
  }

  private buildDamageSnapshot(
    before: BattleSnapshot,
    after: BattleSnapshot,
    context?: PlayCardAnimationContext,
  ): BattleSnapshot {
    if (!context) {
      return this.cloneBattleSnapshot(after)
    }
    const snapshot = this.cloneBattleSnapshot(after)
    if (!context.defeatedEnemyIds?.length) {
      return snapshot
    }
    const beforeMap = new Map(before.enemies.map((enemy) => [enemy.id, enemy]))
    for (const enemyId of context.defeatedEnemyIds) {
      const revert = beforeMap.get(enemyId)
      const enemy = snapshot.enemies.find((candidate) => candidate.id === enemyId)
      if (enemy && revert) {
        enemy.status = revert.status
      }
    }
    return snapshot
  }

  private determineCardDestination(after: BattleSnapshot, cardId: number): 'hand' | 'discard' | 'exile' | undefined {
    if (this.findCardById(after.discardPile, cardId)) {
      return 'discard'
    }
    if (this.findCardById(after.exilePile, cardId)) {
      return 'exile'
    }
    if (this.findCardById(after.hand, cardId)) {
      return 'hand'
    }
    return undefined
  }

  private calculateDamageWait(context?: PlayCardAnimationContext): number {
    if (!context || context.damageEvents.length === 0) {
      return 0
    }
    const firstEvent = context.damageEvents[0]
    if (!firstEvent) {
      return 0
    }
    const hits =
      firstEvent.hitCount && firstEvent.hitCount > 0
        ? firstEvent.hitCount
        : firstEvent.outcomes.length
    if (hits <= 1) {
      return 0
    }
    return (hits - 1) * 200
  }

  private extractDamageOutcomes(context?: PlayCardAnimationContext): readonly DamageOutcome[] | undefined {
    const firstEvent = context?.damageEvents[0]
    if (!firstEvent) {
      return undefined
    }
    return firstEvent.outcomes.map((outcome) => ({ ...outcome }))
  }

  private cloneBattleSnapshot(source: BattleSnapshot): BattleSnapshot {
    return {
      ...source,
      player: { ...source.player },
      enemies: source.enemies.map((enemy) => ({
        ...enemy,
        states: [...enemy.states],
      })),
      deck: [...source.deck],
      hand: [...source.hand],
      discardPile: [...source.discardPile],
      exilePile: [...source.exilePile],
      events: source.events.map((event) => ({ ...event, payload: event.payload })),
      turn: { ...source.turn },
      log: [...source.log],
      status: source.status,
    }
  }

  private findCardById(cards: Card[], cardId: number): Card | undefined {
    return cards.find((card) => card.id === cardId)
  }

  private removeCardFromAllZones(snapshot: BattleSnapshot, cardId: number): void {
    snapshot.hand = this.removeCardById(snapshot.hand, cardId)
    snapshot.discardPile = this.removeCardById(snapshot.discardPile, cardId)
    snapshot.exilePile = this.removeCardById(snapshot.exilePile, cardId)
    snapshot.deck = this.removeCardById(snapshot.deck, cardId)
  }

  private removeCardById(zone: Card[], cardId: number): Card[] {
    const index = zone.findIndex((card) => card.id === cardId)
    if (index === -1) {
      return zone
    }
    const copy = zone.slice()
    copy.splice(index, 1)
    return copy
  }

  private calculateTurnStartDraw(): number {
    return 2
  }
}
