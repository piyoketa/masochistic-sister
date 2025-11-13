import type {
  Battle,
  BattleSnapshot,
  FullBattleSnapshot,
  PlayCardAnimationContext,
  EnemyTurnActionSummary,
  DamageAnimationEvent,
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

interface DrainedAnimationEvents {
  drawEvents: Array<{ cardIds: number[] }>
  manaEvents: Array<{ amount: number }>
  damageEvents: DamageAnimationEvent[]
  defeatEvents: number[]
  cardTrashEvents: Array<{ cardIds: number[] }>
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
  private static readonly CARD_CREATE_ANIMATION_DURATION_MS = 1500

  private readonly battle: Battle
  private readonly actionLog: ActionLog
  private readonly onEntryAppended?: (entry: BattleActionLogEntry, context: EntryAppendContext) => void
  private readonly initialSnapshot: FullBattleSnapshot

  private initialized = false
  private recordedOutcome?: Battle['status']
  private enemyActGroupCounter = 0
  private pendingEnemyActSummaries: EnemyTurnActionSummary[] = []
  private instructionBatchCounter = 0

  constructor(config: OperationRunnerConfig) {
    this.battle = config.battle
    this.actionLog = config.actionLog ?? new ActionLog()
    this.onEntryAppended = config.onEntryAppended
    if (config.initialSnapshot) {
      this.initialSnapshot = this.cloneFullSnapshot(config.initialSnapshot)
      this.battle.restoreFullSnapshot(this.initialSnapshot)
    } else {
      this.initialSnapshot = this.battle.captureFullSnapshot()
    }
  }

  getActionLog(): ActionLog {
    return this.actionLog
  }

  getInitialSnapshot(): FullBattleSnapshot {
    return this.cloneFullSnapshot(this.initialSnapshot)
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
    const needsBeforeSnapshot = entry.type === 'play-card'
    const snapshotBefore = needsBeforeSnapshot ? this.battle.captureFullSnapshot() : undefined
    try {
      index = this.actionLog.push(entry)
      this.battle.executeActionLog(this.actionLog, index)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new OperationRunnableError(message, { actionEntry: entry, cause: error })
    }

    const appendedEntry = this.actionLog.at(index)
    const snapshotAfter = this.battle.captureFullSnapshot()
    const entrySnapshotOverride = this.battle.consumeEntrySnapshotOverride()

    const drainedEvents =
      entry.type === 'enemy-act' ? this.emptyDrainedEvents() : this.drainAnimationEvents()

    if (appendedEntry) {
      if (appendedEntry.type === 'enemy-act') {
        const summary = this.pendingEnemyActSummaries.shift()
        const summarySnapshot = summary?.snapshotAfter ?? entrySnapshotOverride ?? snapshotAfter.snapshot
        const clonedSnapshot = this.cloneBattleSnapshot(summarySnapshot)
        appendedEntry.postEntrySnapshot = clonedSnapshot
        this.attachEnemyActAnimations(appendedEntry, clonedSnapshot, summary)
      } else {
        const baseSnapshot = entrySnapshotOverride ?? snapshotAfter.snapshot
        const clonedSnapshot = this.cloneBattleSnapshot(baseSnapshot)
        appendedEntry.postEntrySnapshot = clonedSnapshot
        if (appendedEntry.type === 'play-card' && snapshotBefore) {
          this.attachPlayCardAnimations(appendedEntry, snapshotBefore.snapshot, clonedSnapshot, drainedEvents)
        } else {
          this.attachSimpleEntryAnimation(appendedEntry, clonedSnapshot, drainedEvents)
        }
      }
    }

    this.emitEntryAppended(entry, index)

    this.appendImmediateEnemyActEntries()

    if (!options?.suppressFlush) {
      this.flushResolvedEvents()
      this.flushStateEvents()
      this.appendBattleOutcomeIfNeeded()
    }

    return index
  }

  private drainAnimationEvents(): DrainedAnimationEvents {
    return {
      drawEvents: this.battle.consumeDrawAnimationEvents(),
      manaEvents: this.battle.consumeManaAnimationEvents(),
      damageEvents: this.battle.consumeDamageAnimationEvents(),
      defeatEvents: this.battle.consumeDefeatAnimationEvents(),
      cardTrashEvents: this.battle.consumeCardTrashAnimationEvents(),
    }
  }

  private emptyDrainedEvents(): DrainedAnimationEvents {
    return {
      drawEvents: [],
      manaEvents: [],
      damageEvents: [],
      defeatEvents: [],
      cardTrashEvents: [],
    }
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
      this.pendingEnemyActSummaries.push(action)
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

  private appendImmediateEnemyActEntries(): void {
    const immediateActions = this.battle.executeInterruptEnemyActions()
    if (immediateActions.length === 0) {
      return
    }
    for (const action of immediateActions) {
      const summary = action.summary
      this.pendingEnemyActSummaries.push(summary)
      const metadataPayload: Record<string, unknown> = { ...summary }
      if (action.trigger) {
        metadataPayload.interruptTrigger = action.trigger
      }
      if (action.metadata) {
        metadataPayload.interruptMetadata = { ...action.metadata }
      }
      this.appendEntry(
        {
          type: 'enemy-act',
          enemyId: summary.enemyId,
          actionId: summary.actionName,
          metadata: metadataPayload,
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
    drainedEvents: DrainedAnimationEvents,
  ): void {
    const context = this.battle.consumeLastPlayCardAnimationContext()
    entry.animations = this.buildPlayCardAnimations(before, after, context?.cardId, drainedEvents)
  }

  private buildPlayCardAnimations(
    before: BattleSnapshot,
    after: BattleSnapshot,
    cardId: number | undefined,
    drainedEvents: DrainedAnimationEvents,
  ): AnimationInstruction[] {
    const animations: AnimationInstruction[] = []
    const damageEvents = drainedEvents.damageEvents
    const defeatIds = drainedEvents.defeatEvents
    const drawEvents = drainedEvents.drawEvents
    const manaEvents = drainedEvents.manaEvents
    const cardTrashEvents = drainedEvents.cardTrashEvents
    const { snapshot: cardMoveSnapshot, destination } =
      cardId !== undefined
        ? this.buildCardMoveSnapshot(before, after, cardId)
        : { snapshot: this.cloneBattleSnapshot(after), destination: undefined }
    const cardMoveStage = destination === 'discard' ? 'card-trash' : 'card-move'
    const cardTitle = this.findCardTitle(before, cardId)
    animations.push(
      this.createInstruction(cardMoveSnapshot, 0, {
        stage: cardMoveStage,
        cardId,
        cardTitle,
      }),
    )

    const hasCardMovementEvents = (drawEvents.length ?? 0) > 0 || (cardTrashEvents.length ?? 0) > 0
    const cardMovementBatchId = hasCardMovementEvents ? this.nextBatchId('card-move') : undefined

    const drawInstructions = this.buildDeckDrawInstructions(drawEvents, after, cardMovementBatchId)
    animations.push(...drawInstructions)

    const manaInstructions = this.buildManaInstructions(manaEvents, after)
    animations.push(...manaInstructions)
    const trashInstructions = this.buildCardTrashInstructions(cardTrashEvents, after, cardMovementBatchId)
    animations.push(...trashInstructions)

    const hasDamage = damageEvents.length > 0
    if (hasDamage) {
      const damageSnapshot = this.buildDamageSnapshot(before, after, defeatIds)
      const damageStage = this.resolveDamageStage(damageEvents, 'damage')
      animations.push(
        this.createInstruction(
          damageSnapshot,
          this.calculateDamageWaitFromEvents(damageEvents),
          {
            stage: damageStage,
            cardId,
            cardTitle,
          },
          this.extractDamageOutcomesFromEvents(damageEvents),
        ),
      )
    }

    const defeatInstructions = this.buildDefeatInstructions(defeatIds, after, { cardId, cardTitle })
    animations.push(...defeatInstructions)

    const needsStateUpdate =
      !hasDamage &&
      drawInstructions.length === 0 &&
      manaInstructions.length === 0 &&
      defeatInstructions.length === 0 &&
      trashInstructions.length === 0
    if (needsStateUpdate) {
      animations.push(
        this.createInstruction(this.cloneBattleSnapshot(after), 0, {
          stage: 'state-update',
          cardId,
          cardTitle,
        }),
      )
    }

    return animations
  }

  private buildCardMoveSnapshot(
    before: BattleSnapshot,
    after: BattleSnapshot,
    cardId: number,
  ): { snapshot: BattleSnapshot; destination?: 'hand' | 'discard' | 'exile' } {
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

    return { snapshot, destination }
  }

  private buildDamageSnapshot(
    before: BattleSnapshot,
    after: BattleSnapshot,
    defeatedEnemyIds: number[],
  ): BattleSnapshot {
    if (!defeatedEnemyIds.length) {
      return this.cloneBattleSnapshot(after)
    }
    const snapshot = this.cloneBattleSnapshot(after)
    const beforeMap = new Map(before.enemies.map((enemy) => [enemy.id, enemy]))
    for (const enemyId of defeatedEnemyIds) {
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

  private calculateDamageWaitFromEvents(events: DamageAnimationEvent[]): number {
    if (!events.length) {
      return 0
    }
    const firstEvent = events[0]
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

  private cloneFullSnapshot(source: FullBattleSnapshot): FullBattleSnapshot {
    return {
      snapshot: this.cloneBattleSnapshot(source.snapshot),
      enemyQueues: source.enemyQueues.map((entry) => ({
        enemyId: entry.enemyId,
        queue: {
          queueState: {
            pending: [...entry.queue.queueState.pending],
            actions: [...entry.queue.queueState.actions],
            metadata: entry.queue.queueState.metadata
              ? { ...entry.queue.queueState.metadata }
              : undefined,
          },
          actionHistory: [...entry.queue.actionHistory],
        },
      })),
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

  private attachSimpleEntryAnimation(
    entry: BattleActionLogEntry,
    snapshot: BattleSnapshot,
    drainedEvents: DrainedAnimationEvents,
  ): void {
    let metadata: Record<string, unknown> | undefined
    let waitMs = 0
    const instructions: AnimationInstruction[] = []
    switch (entry.type) {
      case 'battle-start':
        metadata = { stage: 'battle-start' }
        break
      case 'start-player-turn':
        metadata = { stage: 'turn-start', draw: entry.draw, handOverflow: entry.handOverflow }
        break
      case 'end-player-turn':
        metadata = { stage: 'turn-end' }
        break
      case 'player-event': {
        waitMs = 200
        const payload = entry.payload as { type?: string; payload?: unknown } | undefined
        if (payload?.type === 'mana') {
          const amount =
            typeof (payload.payload as { amount?: unknown })?.amount === 'number'
              ? (payload.payload as { amount?: number }).amount
              : undefined
          metadata = {
            stage: 'mana',
            eventId: entry.eventId,
            amount,
          }
        } else {
          metadata = {
            stage: 'state-update',
            eventId: entry.eventId,
            payload: entry.payload,
          }
        }
        break
      }
      case 'state-event': {
        const payload = entry.payload as { result?: string } | undefined
        const isEscape = entry.subject === 'enemy' && payload?.result === 'escape'
        if (isEscape) {
          metadata = {
            stage: 'escape',
            subject: entry.subject,
            subjectId: entry.subjectId,
            stateId: entry.stateId,
            payload: entry.payload,
          }
          waitMs = 1000
        } else {
          metadata = {
            stage: 'state-update',
            subject: entry.subject,
            subjectId: entry.subjectId,
            stateId: entry.stateId,
            payload: entry.payload,
          }
          waitMs = 0
        }
        break
      }
      case 'victory':
        metadata = { stage: 'victory' }
        waitMs = 400
        break
      case 'gameover':
        metadata = { stage: 'gameover' }
        waitMs = 400
        break
      default:
        entry.animations = entry.animations ?? []
        return
    }

    if (metadata) {
      instructions.push(this.createInstruction(snapshot, waitMs, metadata))
    }

    const damageEvents = drainedEvents.damageEvents
    if (damageEvents.length > 0) {
      const damageStage = this.resolveDamageStage(damageEvents, 'damage')
      instructions.push(
        this.createInstruction(
          snapshot,
          this.calculateDamageWaitFromEvents(damageEvents),
          {
            stage: damageStage,
          },
          this.extractDamageOutcomesFromEvents(damageEvents),
        ),
      )
    }

    const hasCardMovementEvents =
      (drainedEvents.drawEvents?.length ?? 0) > 0 || (drainedEvents.cardTrashEvents?.length ?? 0) > 0
    const cardMovementBatchId = hasCardMovementEvents ? this.nextBatchId('card-move') : undefined

    instructions.push(
      ...this.buildDeckDrawInstructions(drainedEvents.drawEvents, snapshot, cardMovementBatchId),
    )
    instructions.push(...this.buildManaInstructions(drainedEvents.manaEvents, snapshot))
    instructions.push(...this.buildDefeatInstructions(drainedEvents.defeatEvents, snapshot))
    instructions.push(
      ...this.buildCardTrashInstructions(drainedEvents.cardTrashEvents, snapshot, cardMovementBatchId),
    )

    if (instructions.length > 0) {
      entry.animations = instructions
    }
  }

  private attachEnemyActAnimations(
    entry: Extract<BattleActionLogEntry, { type: 'enemy-act' }>,
    snapshot: BattleSnapshot,
    summary?: EnemyTurnActionSummary,
  ): void {
    if (summary?.skipped) {
      entry.animations = []
      return
    }
    const animations: AnimationInstruction[] = []
    // card-createステージより前にカードが手札へ出現するとView側がアニメーションを割り当てられないため、
    // ハイライト/被ダメージまではカード生成分を一時的に隠したスナップショットを用いる。
    const cardAdditionIds =
      summary?.cardsAddedToPlayerHand
        .map((card) => card.id)
        .filter((id): id is number => typeof id === 'number') ?? []
    const snapshotBeforeCardAdditions =
      cardAdditionIds.length > 0 ? this.cloneSnapshotWithoutHandCards(snapshot, cardAdditionIds) : undefined

    animations.push(
      this.createInstruction(snapshotBeforeCardAdditions ?? snapshot, 0, {
        stage: 'enemy-highlight',
        enemyId: entry.enemyId,
        actionId: entry.actionId,
        skipped: summary?.skipped ?? false,
      }),
    )

    const context = summary?.animation
    const damageEvents = context?.damageEvents ?? []
    if (damageEvents.length > 0) {
      const damageStage = this.resolveDamageStage(damageEvents, 'player-damage')
      animations.push(
        this.createInstruction(
          snapshotBeforeCardAdditions ?? snapshot,
          this.calculateEnemyDamageWait(damageEvents, Boolean(summary?.cardsAddedToPlayerHand.length)),
          {
            stage: damageStage,
            enemyId: entry.enemyId,
            actionId: entry.actionId,
          },
          this.extractDamageOutcomesFromEvents(damageEvents),
        ),
      )
    }

    const shouldAddMemoryCards =
      summary && !(context?.playerDefeated ?? false) && summary.cardsAddedToPlayerHand.length > 0
    if (shouldAddMemoryCards) {
      const cardAdditions = summary!.cardsAddedToPlayerHand
      const cardIds = cardAdditions
        .map((card) => card.id)
        .filter((id): id is number => typeof id === 'number')
      const cardTitles = cardAdditions.map((card) => card.title)
      const cardCreateMetadata: Record<string, unknown> = {
        stage: 'card-create',
        durationMs: OperationRunner.CARD_CREATE_ANIMATION_DURATION_MS,
        enemyId: entry.enemyId,
        cardTitles,
        cards: cardTitles,
        cardCount: cardAdditions.length,
      }
      if (cardIds.length > 0) {
        cardCreateMetadata.cardIds = cardIds
      }
      animations.push(
        this.createInstruction(snapshot, 0, cardCreateMetadata),
      )
    }

    const stateDiffs = context?.stateDiffs ?? []
    if (stateDiffs.length > 0) {
      animations.push(
        this.createInstruction(this.cloneBattleSnapshot(snapshot), 0, {
          stage: 'state-update',
          enemyStates: stateDiffs,
        }),
      )
    }

    entry.animations = animations
  }

  private buildDeckDrawInstructions(
    drawEvents: Array<{ cardIds: number[] }>,
    snapshot: BattleSnapshot,
    sharedBatchId?: string,
  ): AnimationInstruction[] {
    if (!drawEvents || drawEvents.length === 0) {
      return []
    }
    return drawEvents
      .filter((event) => (event.cardIds?.length ?? 0) > 0)
      .map((event) => {
        const batchId = sharedBatchId ?? this.nextBatchId('deck-draw')
        const durationMs = this.calculateDeckDrawDuration(event.cardIds.length)
        return this.createInstruction(
          this.cloneBattleSnapshot(snapshot),
          0,
          {
            stage: 'deck-draw',
            cardIds: event.cardIds,
            durationMs,
          },
          undefined,
          batchId,
        )
      })
  }

  private buildManaInstructions(
    manaEvents: Array<{ amount: number }>,
    snapshot: BattleSnapshot,
  ): AnimationInstruction[] {
    if (!manaEvents || manaEvents.length === 0) {
      return []
    }
    return manaEvents
      .filter((event) => event.amount !== 0)
      .map((event) =>
        this.createInstruction(this.cloneBattleSnapshot(snapshot), 0, {
          stage: 'mana',
          amount: event.amount,
        }),
      )
  }

  private buildCardTrashInstructions(
    trashEvents: Array<{ cardIds: number[] }>,
    snapshot: BattleSnapshot,
    sharedBatchId?: string,
  ): AnimationInstruction[] {
    if (!trashEvents || trashEvents.length === 0) {
      return []
    }
    return trashEvents.map((event) => {
      const batchId = sharedBatchId ?? this.nextBatchId('card-trash')
        return this.createInstruction(
          this.cloneBattleSnapshot(snapshot),
          0,
          {
            stage: 'card-trash',
            cardIds: event.cardIds,
            cardTitles: event.cardIds
              .map((id) => this.findCardTitle(snapshot, id))
            .filter((title): title is string => Boolean(title)),
        },
        undefined,
        batchId,
      )
    })
  }

  private cloneSnapshotWithoutHandCards(snapshot: BattleSnapshot, cardIds: number[]): BattleSnapshot {
    if (cardIds.length === 0) {
      return this.cloneBattleSnapshot(snapshot)
    }
    const clone = this.cloneBattleSnapshot(snapshot)
    const removeSet = new Set(cardIds)
    clone.hand = clone.hand.filter((card) => {
      const cardId = card.id
      return !(typeof cardId === 'number' && removeSet.has(cardId))
    })
    return clone
  }

  private resolveDamageStage(
    events: DamageAnimationEvent[],
    defaultStage: 'damage' | 'player-damage',
  ): 'damage' | 'player-damage' {
    if (events.some((event) => event.targetId === undefined)) {
      return 'player-damage'
    }
    return defaultStage
  }

  private findCardTitle(snapshot: BattleSnapshot, cardId: number | undefined): string | undefined {
    if (cardId === undefined) {
      return undefined
    }
    const zones = [snapshot.hand, snapshot.discardPile, snapshot.exilePile, snapshot.deck]
    for (const zone of zones) {
      const card = zone.find((candidate) => candidate.id === cardId)
      if (card) {
        return card.title
      }
    }
    return undefined
  }

  private buildDefeatInstructions(
    defeatEnemyIds: number[],
    snapshot: BattleSnapshot,
    metadataOverrides?: Record<string, unknown>,
  ): AnimationInstruction[] {
    if (!defeatEnemyIds || defeatEnemyIds.length === 0) {
      return []
    }
    const uniqueIds = Array.from(new Set(defeatEnemyIds))
    return [
      this.createInstruction(this.cloneBattleSnapshot(snapshot), 1000, {
        stage: 'defeat',
        defeatedEnemyIds: uniqueIds,
        ...(metadataOverrides ?? {}),
      }),
    ]
  }

  private createInstruction(
    snapshot: BattleSnapshot,
    waitMs: number,
    metadata: Record<string, unknown>,
    damageOutcomes?: readonly DamageOutcome[],
    batchId?: string,
  ): AnimationInstruction {
    return {
      snapshot: this.cloneBattleSnapshot(snapshot),
      waitMs,
      batchId: batchId ?? this.nextBatchId(typeof metadata.stage === 'string' ? metadata.stage : 'instruction'),
      metadata,
      damageOutcomes: damageOutcomes ? damageOutcomes.map((outcome) => ({ ...outcome })) : undefined,
    }
  }

  private extractDamageOutcomesFromEvents(
    events?: readonly DamageAnimationEvent[],
  ): readonly DamageOutcome[] | undefined {
    const firstEvent = events?.[0]
    if (!firstEvent) {
      return undefined
    }
    return firstEvent.outcomes.map((outcome) => ({ ...outcome }))
  }

  private calculateEnemyDamageWait(events: DamageAnimationEvent[], hasCardAdditions: boolean): number {
    if (hasCardAdditions || events.length === 0) {
      return 0
    }
    const firstEvent = events[0]
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

  private calculateDeckDrawDuration(cardCount: number): number {
    if (cardCount <= 0) {
      return 0
    }
    const additionalDelay = Math.max(0, cardCount - 1) * 100
    return 600 + additionalDelay
  }

  private calculateTurnStartDraw(): number {
    return 2
  }

  private nextBatchId(stage: string): string {
    return `${stage}:${this.instructionBatchCounter++}`
  }
}
