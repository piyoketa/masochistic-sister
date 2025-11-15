import type {
  Battle,
  BattleSnapshot,
  FullBattleSnapshot,
  PlayCardAnimationContext,
  EnemyTurnActionSummary,
  DamageAnimationEvent,
} from './Battle'
import type {
  AnimationInstruction,
  AnimationStageMetadata,
  AnimationBatch,
  BattleActionLogEntry,
  EnemyActEntryMetadata,
} from './ActionLog'
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
  stateCardEvents: StateCardAnimationEvent[]
  memoryCardEvents: MemoryCardAnimationEvent[]
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

type StateCardAnimationEvent = ReturnType<Battle['consumeStateCardAnimationEvents']>[number]
type MemoryCardAnimationEvent = ReturnType<Battle['consumeMemoryCardAnimationEvents']>[number]

export class OperationRunner {
  private static readonly CARD_CREATE_ANIMATION_DURATION_MS = 1500
  private static readonly CARD_ELIMINATE_ANIMATION_DURATION_MS = 720
  private static readonly STATE_CARD_ANIMATION_DURATION_MS = 500
  private static readonly MEMORY_CARD_ANIMATION_DURATION_MS = 1500

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

    const drainedEvents = this.drainAnimationEvents()

    if (appendedEntry) {
      if (appendedEntry.type === 'enemy-act') {
        const summary = this.pendingEnemyActSummaries.shift()
        const summarySnapshot = summary?.snapshotAfter ?? entrySnapshotOverride ?? snapshotAfter.snapshot
        const clonedSnapshot = this.cloneBattleSnapshot(summarySnapshot)
        appendedEntry.postEntrySnapshot = clonedSnapshot
        this.attachEnemyActAnimations(appendedEntry, clonedSnapshot, drainedEvents, summary)
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
      stateCardEvents: this.battle.consumeStateCardAnimationEvents(),
      memoryCardEvents: this.battle.consumeMemoryCardAnimationEvents(),
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
          actionName: action.actionName,
          metadata: this.createEnemyActEntryMetadata(action),
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
      const metadataPayload = this.createEnemyActEntryMetadata(summary)
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
          actionName: summary.actionName,
          metadata: metadataPayload,
        },
        { suppressFlush: true },
      )
    }
  }

  /**
   * 戦闘ログに書き出す敵行動の metadata は snapshot を含まない形で複製し、
   * ActionLog の型制約（`EnemyActEntryMetadata`）を満たすようにする。
   * snapshot は `pendingEnemyActSummaries` 側で保持し、アニメーションで再利用する想定。
   */
  private createEnemyActEntryMetadata(action: EnemyTurnActionSummary): EnemyActEntryMetadata {
    const { snapshotAfter, cardsAddedToPlayerHand, animation, metadata, ...rest } = action
    return {
      ...rest,
      cardsAddedToPlayerHand: cardsAddedToPlayerHand.map((card) => ({ ...card })),
      animation: animation
        ? {
            damageEvents: animation.damageEvents.map((event) => ({
              ...event,
              outcomes: event.outcomes.map((outcome) => ({ ...outcome })),
            })),
            cardAdditions: animation.cardAdditions.map((card) => ({ ...card })),
            playerDefeated: animation.playerDefeated,
            stateDiffs: animation.stateDiffs.map((diff) => ({
              enemyId: diff.enemyId,
              states: diff.states.map((state) => ({ ...state })),
            })),
          }
        : undefined,
      metadata: metadata ? { ...metadata } : undefined,
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
    entry.animationBatches = this.buildPlayCardAnimations(before, after, context?.cardId, drainedEvents)
  }

  private buildPlayCardAnimations(
    before: BattleSnapshot,
    after: BattleSnapshot,
    cardId: number | undefined,
    drainedEvents: DrainedAnimationEvents,
  ): AnimationBatch[] {
    const batches: AnimationBatch[] = []
    const damageEvents = drainedEvents.damageEvents
    const defeatIds = drainedEvents.defeatEvents
    const drawEvents = drainedEvents.drawEvents
    const manaEvents = drainedEvents.manaEvents
    const cardTrashEvents = drainedEvents.cardTrashEvents
    const { snapshot: cardMoveSnapshot, destination } =
      cardId !== undefined
        ? this.buildCardMoveSnapshot(before, after, cardId)
        : { snapshot: this.cloneBattleSnapshot(after), destination: undefined }
    const cardMoveStage =
      destination === 'discard' ? 'card-trash' : destination === 'exile' ? 'card-eliminate' : undefined
    const cardMoveWaitMs =
      cardMoveStage === 'card-eliminate' ? OperationRunner.CARD_ELIMINATE_ANIMATION_DURATION_MS : 0
    const cardTitle = this.findCardTitle(before, cardId)
    if (cardMoveStage) {
      const metadata: AnimationStageMetadata = {
        stage: cardMoveStage,
        cardIds: cardId !== undefined ? [cardId] : [],
        cardTitles: cardTitle ? [cardTitle] : undefined,
      }
      batches.push(
        this.createBatch(cardMoveSnapshot, [
          {
            waitMs: cardMoveWaitMs,
            metadata,
          },
        ]),
      )
    }

    const drawBatches = this.buildDeckDrawBatches(drawEvents, after)
    batches.push(...drawBatches)

    const manaBatches = this.buildManaBatches(manaEvents, after)
    batches.push(...manaBatches)
    const trashBatches = this.buildCardTrashBatches(cardTrashEvents, after)
    batches.push(...trashBatches)

    const hasDamage = damageEvents.length > 0
    if (hasDamage) {
      const damageSnapshot = this.buildDamageSnapshot(before, after, defeatIds)
      const damageStage = this.resolveDamageStage(damageEvents, 'damage')
      batches.push(
        this.createBatch(
          damageSnapshot,
          [
            {
              waitMs: this.calculateDamageWaitFromEvents(damageEvents),
              metadata: {
                stage: damageStage,
                cardId,
                cardTitle,
                damageOutcomes: this.extractDamageOutcomesFromEvents(damageEvents),
              },
            },
          ],
        ),
      )
    }

    const defeatBatches = this.buildDefeatBatches(defeatIds, after, { cardId, cardTitle })
    batches.push(...defeatBatches)
    const stateCardBatches = this.buildStateCardBatches(drainedEvents.stateCardEvents, after)
    batches.push(...stateCardBatches)
    const memoryCardBatches = this.buildMemoryCardBatches(drainedEvents.memoryCardEvents, after)
    batches.push(...memoryCardBatches)

    return batches
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
    let metadata: AnimationStageMetadata | undefined
    let waitMs = 0
    const batches: AnimationBatch[] = []
    switch (entry.type) {
      case 'battle-start':
        metadata = { stage: 'battle-start' }
        break
      case 'start-player-turn':
        metadata = { stage: 'turn-start' }
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
        entry.animationBatches = entry.animationBatches ?? []
        return
    }

    if (metadata) {
      batches.push(
        this.createBatch(snapshot, [
          {
            waitMs,
            metadata,
          },
        ]),
      )
    }

    const damageEvents = drainedEvents.damageEvents
    if (damageEvents.length > 0) {
      const damageStage = this.resolveDamageStage(damageEvents, 'damage')
      batches.push(
        this.createBatch(snapshot, [
          {
            waitMs: this.calculateDamageWaitFromEvents(damageEvents),
            metadata: {
              stage: damageStage,
              damageOutcomes: this.extractDamageOutcomesFromEvents(damageEvents),
            },
          },
        ]),
      )
    }

    batches.push(...this.buildDeckDrawBatches(drainedEvents.drawEvents, snapshot))
    batches.push(...this.buildManaBatches(drainedEvents.manaEvents, snapshot))
    batches.push(...this.buildDefeatBatches(drainedEvents.defeatEvents, snapshot))
    batches.push(...this.buildCardTrashBatches(drainedEvents.cardTrashEvents, snapshot))
    batches.push(...this.buildStateCardBatches(drainedEvents.stateCardEvents, snapshot))
    batches.push(...this.buildMemoryCardBatches(drainedEvents.memoryCardEvents, snapshot))

    if (batches.length > 0) {
      entry.animationBatches = batches
    }
  }

  private attachEnemyActAnimations(
    entry: Extract<BattleActionLogEntry, { type: 'enemy-act' }>,
    snapshot: BattleSnapshot,
    drainedEvents: DrainedAnimationEvents,
    summary?: EnemyTurnActionSummary,
  ): void {
    if (summary?.skipped) {
      entry.animationBatches = []
      return
    }
    const batches: AnimationBatch[] = []
    // create-state-card / memory-card ステージより前にカードが手札へ出現するとView側がアニメーションを割り当てられないため、
    // ハイライト/被ダメージまではカード生成分を一時的に隠したスナップショットを用いる。
    const cardAdditionIds =
      summary?.cardsAddedToPlayerHand
        .map((card) => card.id)
        .filter((id): id is number => typeof id === 'number') ?? []
    const snapshotBeforeCardAdditions =
      cardAdditionIds.length > 0 ? this.cloneSnapshotWithoutHandCards(snapshot, cardAdditionIds) : undefined

    batches.push(
      this.createBatch(snapshotBeforeCardAdditions ?? snapshot, [
        {
          waitMs: 0,
          metadata: {
            stage: 'enemy-highlight',
            enemyId: entry.enemyId,
            actionName: entry.actionName,
            skipped: summary?.skipped ?? false,
          },
        },
      ]),
    )

    const context = summary?.animation
    const damageEvents = context?.damageEvents ?? []
    if (damageEvents.length > 0) {
      const damageStage = this.resolveDamageStage(damageEvents, 'player-damage')
      batches.push(
        this.createBatch(snapshotBeforeCardAdditions ?? snapshot, [
          {
            waitMs: this.calculateEnemyDamageWait(damageEvents, Boolean(summary?.cardsAddedToPlayerHand.length)),
            metadata: {
              stage: damageStage,
              enemyId: entry.enemyId,
              actionName: entry.actionName,
              damageOutcomes: this.extractDamageOutcomesFromEvents(damageEvents),
            },
          },
        ]),
      )
    }

    batches.push(...this.buildStateCardBatches(drainedEvents.stateCardEvents, snapshot))
    batches.push(...this.buildMemoryCardBatches(drainedEvents.memoryCardEvents, snapshot))

    entry.animationBatches = batches
  }

  private buildDeckDrawBatches(
    drawEvents: Array<{ cardIds: number[]; drawnCount?: number; handOverflow?: boolean }>,
    snapshot: BattleSnapshot,
  ): AnimationBatch[] {
    if (!drawEvents || drawEvents.length === 0) {
      return []
    }
    return drawEvents
      .filter((event) => (event.cardIds?.length ?? 0) > 0 || event.handOverflow)
      .map((event) => {
        const batchId = this.nextBatchId('deck-draw')
        const durationMs = this.calculateDeckDrawDuration(event.cardIds.length)
        const metadata: AnimationStageMetadata = {
          stage: 'deck-draw',
          cardIds: event.cardIds ?? [],
          durationMs,
        }
        if (typeof event.drawnCount === 'number') {
          metadata.draw = event.drawnCount
        }
        if (event.handOverflow) {
          metadata.handOverflow = true
        }
        return this.createBatch(
          snapshot,
          [
            {
              waitMs: 0,
              metadata,
            },
          ],
          batchId,
        )
      })
  }

  private buildManaBatches(
    manaEvents: Array<{ amount: number }>,
    snapshot: BattleSnapshot,
  ): AnimationBatch[] {
    if (!manaEvents || manaEvents.length === 0) {
      return []
    }
    return manaEvents
      .filter((event) => event.amount !== 0)
      .map((event) =>
        this.createBatch(snapshot, [
          {
            waitMs: 0,
            metadata: {
              stage: 'mana',
              amount: event.amount,
            },
          },
        ]),
      )
  }

  private buildCardTrashBatches(
    trashEvents: Array<{ cardIds: number[] }>,
    snapshot: BattleSnapshot,
  ): AnimationBatch[] {
    if (!trashEvents || trashEvents.length === 0) {
      return []
    }
    return trashEvents.map((event) => {
      const batchId = this.nextBatchId('card-trash')
      return this.createBatch(
        snapshot,
        [
          {
            waitMs: 0,
            metadata: {
              stage: 'card-trash',
              cardIds: event.cardIds,
              cardTitles: event.cardIds
                .map((id) => this.findCardTitle(snapshot, id))
                .filter((title): title is string => Boolean(title)),
            },
          },
        ],
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

  private buildDefeatBatches(
    defeatEnemyIds: number[],
    snapshot: BattleSnapshot,
    metadataOverrides?: { cardId?: number; cardTitle?: string },
  ): AnimationBatch[] {
    if (!defeatEnemyIds || defeatEnemyIds.length === 0) {
      return []
    }
    const uniqueIds = Array.from(new Set(defeatEnemyIds))
    return [
      this.createBatch(snapshot, [
        {
          waitMs: 1000,
          metadata: {
            stage: 'defeat',
            defeatedEnemyIds: uniqueIds,
            ...(metadataOverrides ?? {}),
          },
        },
      ]),
    ]
  }

  private buildStateCardBatches(
    events: StateCardAnimationEvent[],
    snapshot: BattleSnapshot,
  ): AnimationBatch[] {
    if (!events || events.length === 0) {
      return []
    }
    return events.map((event) =>
      this.createBatch(snapshot, [
        {
          waitMs: OperationRunner.STATE_CARD_ANIMATION_DURATION_MS,
          metadata: {
            stage: 'create-state-card',
            durationMs: OperationRunner.STATE_CARD_ANIMATION_DURATION_MS,
            stateId: event.stateId,
            stateName: event.stateName,
            cardId: event.cardId,
            cardIds: event.cardId !== undefined ? [event.cardId] : undefined,
            cardTitle: event.cardTitle ?? event.stateName,
            cardTitles: event.cardTitle ? [event.cardTitle] : event.stateName ? [event.stateName] : undefined,
            cardCount: event.cardId !== undefined ? 1 : undefined,
            enemyId: event.enemyId,
          },
        },
      ]),
    )
  }

  private buildMemoryCardBatches(
    events: MemoryCardAnimationEvent[],
    snapshot: BattleSnapshot,
  ): AnimationBatch[] {
    if (!events || events.length === 0) {
      return []
    }
    return events.map((event) =>
      this.createBatch(snapshot, [
        {
          waitMs: OperationRunner.MEMORY_CARD_ANIMATION_DURATION_MS,
          metadata: {
            stage: 'memory-card',
            durationMs: OperationRunner.MEMORY_CARD_ANIMATION_DURATION_MS,
            stateId: event.stateId,
            stateName: event.stateName,
            cardId: event.cardId,
            cardIds: event.cardIds ?? (event.cardId !== undefined ? [event.cardId] : undefined),
            cardTitle: event.cardTitle ?? event.stateName,
            cardTitles:
              event.cardTitles ??
              (event.cardTitle ? [event.cardTitle] : event.stateName ? [event.stateName] : undefined),
            cardCount: event.cardCount ?? (event.cardIds?.length ?? (event.cardId !== undefined ? 1 : undefined)),
            enemyId: event.enemyId,
            soundId: event.soundId,
          },
        },
      ]),
    )
  }

  private createBatch(
    snapshot: BattleSnapshot,
    instructions: AnimationInstruction[],
    batchId?: string,
  ): AnimationBatch {
    const normalizedInstructions = instructions.map((instruction) => {
      const metadata = instruction.metadata ? { ...instruction.metadata } : undefined
      if (
        metadata &&
        'damageOutcomes' in metadata &&
        Array.isArray((metadata as { damageOutcomes?: readonly DamageOutcome[] }).damageOutcomes)
      ) {
        ;(metadata as { damageOutcomes?: readonly DamageOutcome[] }).damageOutcomes = (
          metadata as { damageOutcomes?: readonly DamageOutcome[] }
        ).damageOutcomes?.map((outcome) => ({ ...outcome }))
      }
      return {
        waitMs: instruction.waitMs,
        metadata,
      }
    })
    const firstStage = normalizedInstructions[0]?.metadata?.stage
    return {
      batchId: batchId ?? this.nextBatchId(typeof firstStage === 'string' ? firstStage : 'instruction'),
      snapshot: this.cloneBattleSnapshot(snapshot),
      instructions: normalizedInstructions,
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
