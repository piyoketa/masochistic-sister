
import { Card } from '../entities/Card'
import type { CardOperation } from '../entities/operations'
import type { Player } from '../entities/Player'
import type { Enemy, EnemyQueueSnapshot, EnemyStatus } from '../entities/Enemy'
import type { EnemyTeam } from '../entities/EnemyTeam'
import type { Action, ActionAudioCue, ActionContext, ActionCutInCue } from '../entities/Action'
import type { State } from '../entities/State'
import { Hand } from './Hand'
import { Deck } from './Deck'
import { DiscardPile } from './DiscardPile'
import { ExilePile } from './ExilePile'
import { BattleEventQueue, type BattleEvent } from './BattleEvent'
import { BattleLog } from './BattleLog'
import type { BattleLogEntry } from './BattleLog'
import { TurnManager, type TurnState } from './TurnManager'
import { CardRepository } from '../repository/CardRepository'
import { ActionLog, type BattleActionLogEntry } from './ActionLog'
import type { ActionType } from '../entities/Action'
import type { DamageEffectType, DamageOutcome } from '../entities/Damages'
import type { EnemyActionHint, EnemySkill } from '@/types/battle'
import { buildEnemyActionHints } from './enemyActionHintBuilder'
import { instantiateRelic } from '../entities/relics/relicLibrary'
import type { Relic } from '../entities/relics/Relic'

export type BattleStatus = 'in-progress' | 'victory' | 'gameover'

export interface BattleConfig {
  id: string
  player: Player
  enemyTeam: EnemyTeam
  deck: Deck
  hand?: Hand
  discardPile?: DiscardPile
  exilePile?: ExilePile
  events?: BattleEventQueue
  log?: BattleLog
  turn?: TurnManager
  cardRepository?: CardRepository
  relicClassNames?: string[]
}

export interface BattleSnapshot {
  id: string
  player: {
    id: string
    name: string
    currentHp: number
    maxHp: number
    currentMana: number
    maxMana: number
    relics: Array<{ className: string; active: boolean }>
  }
  enemies: Array<{
    id: number
    name: string
    image: string
    currentHp: number
    maxHp: number
    states: State[]
    hasActedThisTurn: boolean
    status: EnemyStatus
    skills: EnemySkill[]
    nextActions?: EnemyActionHint[]
  }>
  deck: Card[]
  hand: Card[]
  discardPile: Card[]
  exilePile: Card[]
  events: BattleEvent[]
  turn: TurnState
  log: ReturnType<BattleLog['list']>
  status: BattleStatus
}

export interface EnemyTurnActionCardGain {
  id?: number
  title: string
}

export type EnemyTurnSkipReason = 'already-acted' | 'no-action' | 'defeated' | 'no-target'

export interface EnemyStateDiff {
  enemyId: number
  states: Array<{ id: string; magnitude?: number }>
}

interface BaseCardAnimationEvent {
  stateId?: string
  stateName?: string
  cardId?: number
  cardIds?: number[]
  cardTitle?: string
  cardTitles?: string[]
  cardCount?: number
  enemyId?: number | null
}

export interface StateCardAnimationEvent extends BaseCardAnimationEvent {}

export interface MemoryCardAnimationEvent extends BaseCardAnimationEvent {
  soundId?: string
}

export interface EnemyActAnimationContext {
  damageEvents: DamageAnimationEvent[]
  cardAdditions: EnemyTurnActionCardGain[]
  playerDefeated: boolean
  stateDiffs: EnemyStateDiff[]
}

export interface EnemyTurnActionSummary {
  enemyId: number
  enemyName: string
  actionName: string
  actionType?: ActionType
  skipped: boolean
  skipReason?: EnemyTurnSkipReason
  damageToPlayer?: number
  cardsAddedToPlayerHand: EnemyTurnActionCardGain[]
  animation?: EnemyActAnimationContext
  stateCardEvents?: StateCardAnimationEvent[]
  memoryCardEvents?: MemoryCardAnimationEvent[]
  snapshotAfter: BattleSnapshot
  metadata?: Record<string, unknown>
}

export interface StateEventLogEntry {
  subject: 'player' | 'enemy'
  subjectId?: number
  stateId: string
  payload?: unknown
}

export interface FullBattleSnapshot {
  snapshot: BattleSnapshot
  enemyQueues: Array<{
    enemyId: number
    queue: EnemyQueueSnapshot
  }>
  relicStates?: Array<{ className: string; state: unknown }>
}

export interface EnemyTurnSummary {
  actions: EnemyTurnActionSummary[]
}

export type InterruptEnemyActionTrigger = 'card' | 'state' | 'trap' | string

interface QueuedInterruptEnemyAction {
  enemyId: number
  trigger?: InterruptEnemyActionTrigger
  metadata?: Record<string, unknown>
}

export interface DamageAnimationEvent {
  targetId?: number
  outcomes: DamageOutcome[]
  effectType?: DamageEffectType
  hitCount?: number
}

export interface PlayCardAnimationContext {
  cardId?: number
  audio?: ActionAudioCue
  cutin?: ActionCutInCue
  cardTags?: string[]
}

export class Battle {
  private readonly idValue: string
  private readonly playerValue: Player
  private readonly enemyTeamValue: EnemyTeam
  private readonly deckValue: Deck
  private readonly handValue: Hand
  private readonly discardPileValue: DiscardPile
  private readonly exilePileValue: ExilePile
  private readonly eventsValue: BattleEventQueue
  private readonly logValue: BattleLog
  private readonly turnValue: TurnManager
  private readonly cardRepositoryValue: CardRepository
  private relicClassNames: string[]
  private relicInstances: Relic[]
  private logSequence = 0
  private executedActionLogIndex = -1
  private eventSequence = 0
  private lastEnemyTurnSummaryValue?: EnemyTurnSummary
  private statusValue: BattleStatus = 'in-progress'
  private resolvedEventsBuffer: BattleEvent[] = []
  private stateEventBuffer: StateEventLogEntry[] = []
  private pendingDamageAnimationEvents: DamageAnimationEvent[] = []
  private pendingCardTrashAnimationEvents: Array<{
    cardIds: number[]
    cardTitles?: string[]
    variant?: 'trash' | 'eliminate'
  }> = []
  private pendingManaAnimationEvents: Array<{ amount: number }> = []
  private pendingDefeatAnimationEvents: number[] = []
  private pendingDrawAnimationEvents: Array<{
    cardIds: number[]
    drawnCount?: number
    handOverflow?: boolean
  }> = []
  private pendingStateCardAnimationEvents: StateCardAnimationEvent[] = []
  private pendingMemoryCardAnimationEvents: MemoryCardAnimationEvent[] = []
  private interruptEnemyActionQueue: QueuedInterruptEnemyAction[] = []
  private lastPlayCardAnimationContext?: PlayCardAnimationContext
  private pendingEntrySnapshotOverride?: BattleSnapshot

  constructor(config: BattleConfig) {
    this.idValue = config.id
    this.playerValue = config.player
    this.enemyTeamValue = config.enemyTeam
    this.deckValue = config.deck
    this.handValue = config.hand ?? new Hand()
    this.discardPileValue = config.discardPile ?? new DiscardPile()
    this.exilePileValue = config.exilePile ?? new ExilePile()
    this.eventsValue = config.events ?? new BattleEventQueue()
    this.logValue = config.log ?? new BattleLog()
    this.turnValue = config.turn ?? new TurnManager()
    this.cardRepositoryValue = config.cardRepository ?? new CardRepository()
    this.relicClassNames = [...(config.relicClassNames ?? [])]
    this.relicInstances = this.buildRelicInstances(this.relicClassNames, [])
    this.playerValue.bindHand(this.handValue)
    this.cardRepositoryValue.bindZones({
      deck: this.deckValue,
      hand: this.handValue,
      discardPile: this.discardPileValue,
      exilePile: this.exilePileValue,
    })
  }

  get id(): string {
    return this.idValue
  }

  get player(): Player {
    return this.playerValue
  }

  get enemyTeam(): EnemyTeam {
    return this.enemyTeamValue
  }

  get deck(): Deck {
    return this.deckValue
  }

  get hand(): Hand {
    return this.handValue
  }

  get discardPile(): DiscardPile {
    return this.discardPileValue
  }

  get exilePile(): ExilePile {
    return this.exilePileValue
  }

  get events(): BattleEventQueue {
    return this.eventsValue
  }

  get log(): BattleLog {
    return this.logValue
  }

  get turn(): TurnManager {
    return this.turnValue
  }

  get cardRepository(): CardRepository {
    return this.cardRepositoryValue
  }

  get status(): BattleStatus {
    return this.statusValue
  }

  queueInterruptEnemyAction(enemyId: number, options?: {
    trigger?: InterruptEnemyActionTrigger
    metadata?: Record<string, unknown>
  }): void {
    this.interruptEnemyActionQueue.push({
      enemyId,
      trigger: options?.trigger,
      metadata: options?.metadata ? { ...options.metadata } : undefined,
    })
  }

  executeInterruptEnemyActions(): Array<{
    summary: EnemyTurnActionSummary
    trigger?: InterruptEnemyActionTrigger
    metadata?: Record<string, unknown>
  }> {
    if (this.interruptEnemyActionQueue.length === 0) {
      return []
    }

    const executions: Array<{
      summary: EnemyTurnActionSummary
      trigger?: InterruptEnemyActionTrigger
      metadata?: Record<string, unknown>
    }> = []

    while (this.interruptEnemyActionQueue.length > 0) {
      const request = this.interruptEnemyActionQueue.shift()
      if (!request) {
        break
      }
      const summary = this.performEnemyAction(request.enemyId)
      executions.push({
        summary: this.cloneEnemyActionSummary(summary),
        trigger: request.trigger,
        metadata: request.metadata ? { ...request.metadata } : undefined,
      })
    }

    return executions
  }

  markEntrySnapshotBoundary(snapshot?: BattleSnapshot): void {
    const source = snapshot ?? this.getSnapshot()
    this.pendingEntrySnapshotOverride = this.cloneBattleSnapshot(source)
  }

  consumeEntrySnapshotOverride(): BattleSnapshot | undefined {
    const snapshot = this.pendingEntrySnapshotOverride
    this.pendingEntrySnapshotOverride = undefined
    return snapshot ? this.cloneBattleSnapshot(snapshot) : undefined
  }

  getLastEnemyTurnSummary(): EnemyTurnSummary | undefined {
    if (!this.lastEnemyTurnSummaryValue) {
      return undefined
    }

    // summaryは履歴参照用なので、参照渡しによる外部改変を避けるために浅いコピーを返す
    return {
      actions: this.lastEnemyTurnSummaryValue.actions.map((action) => this.cloneEnemyActionSummary(action)),
    }
  }

  consumeResolvedEvents(): BattleEvent[] {
    const events = this.resolvedEventsBuffer.map((event) => ({
      ...event,
      payload: { ...event.payload },
    }))
    this.resolvedEventsBuffer = []
    return events
  }

  recordStateEvent(event: StateEventLogEntry): void {
    this.stateEventBuffer.push(event)
  }

  consumeStateEvents(): StateEventLogEntry[] {
    const events = [...this.stateEventBuffer]
    this.stateEventBuffer = []
    return events
  }

  getSnapshot(): BattleSnapshot {
    const relicSnapshots =
      this.relicInstances.map((relic) => {
        const className = relic.constructor.name
        const active = relic.isActive({ battle: this, player: this.playerValue })
        return { className, active }
      }) ?? []

    const deckWithCost = this.deckValue.list().map((card) => this.applyCardRuntimeCost(card))
    const handWithCost = this.handValue.list().map((card) => this.applyCardRuntimeCost(card))
    const discardWithCost = this.discardPileValue
      .list()
      .map((card) => this.applyCardRuntimeCost(card))
    const exileWithCost = this.exilePileValue.list().map((card) => this.applyCardRuntimeCost(card))

    return {
      id: this.idValue,
      player: {
        id: this.playerValue.id,
        name: this.playerValue.name,
        currentHp: this.playerValue.currentHp,
        maxHp: this.playerValue.maxHp,
        currentMana: this.playerValue.currentMana,
        maxMana: this.playerValue.maxMana,
        relics: relicSnapshots,
      },
      enemies: this.enemyTeamValue.members.map<BattleSnapshot['enemies'][number]>((enemy: Enemy) => {
        const id = enemy.id
        if (id === undefined) {
          throw new Error(`Enemy ${enemy.name} has no repository id`)
        }

        return {
          id,
          name: enemy.name,
          image: enemy.image,
          currentHp: enemy.currentHp,
          maxHp: enemy.maxHp,
          states: enemy.states,
          hasActedThisTurn: enemy.hasActedThisTurn,
          status: enemy.status,
          skills: enemy.actions.map((action) => ({
            name: action.name,
            detail: action.describe(),
          })),
          nextActions: buildEnemyActionHints(this, enemy),
        }
      }),
      deck: deckWithCost,
      hand: handWithCost,
      discardPile: discardWithCost,
      exilePile: exileWithCost,
      events: this.eventsValue.list(),
      turn: this.turnValue.current,
      log: this.logValue.list(),
      status: this.statusValue,
    }
  }

  captureFullSnapshot(): FullBattleSnapshot {
    const base = this.getSnapshot()
    const enemyQueues = this.enemyTeamValue.members.map((enemy) => ({
      enemyId: enemy.id ?? -1,
      queue: enemy.serializeQueueSnapshot(),
    }))

    return {
      snapshot: base,
      enemyQueues,
      relicStates: this.relicInstances.map((relic) => ({
        className: relic.constructor.name,
        state: relic.saveState(),
      })),
    }
  }

  getRelicClassNames(): string[] {
    return [...this.relicClassNames]
  }

  getRelicInstances(): Relic[] {
    return [...this.relicInstances]
  }

  restoreFullSnapshot(state: FullBattleSnapshot): void {
    const base = state.snapshot
    this.statusValue = base.status
    this.playerValue.setCurrentHp(base.player.currentHp)
    this.playerValue.setCurrentMana(base.player.currentMana)

    this.deckValue.replace(base.deck)
    this.handValue.replace(base.hand)
    this.discardPileValue.replace(base.discardPile)
    this.exilePileValue.replace(base.exilePile)
    this.eventsValue.replace(base.events)
    this.turnValue.setState(base.turn)
    this.logValue.replace(base.log)
    this.rebuildRelics(base.player.relics.map((relic) => relic.className), state.relicStates)

    const idToEnemy = new Map<number, Enemy>()
    for (const enemy of this.enemyTeamValue.members) {
      if (enemy.id !== undefined) {
        idToEnemy.set(enemy.id, enemy)
      }
    }

    for (const enemySnapshot of base.enemies) {
      const enemy = idToEnemy.get(enemySnapshot.id)
      if (!enemy) {
        continue
      }
      enemy.setCurrentHp(enemySnapshot.currentHp)
      enemy.setStatus(enemySnapshot.status)
      enemy.setHasActedThisTurn(enemySnapshot.hasActedThisTurn)
      enemy.replaceStates(enemySnapshot.states)
      const queueState = state.enemyQueues.find((entry) => entry.enemyId === enemySnapshot.id)
      if (queueState) {
        enemy.restoreQueueSnapshot(queueState.queue)
      }
    }

    this.resolvedEventsBuffer = []
    this.stateEventBuffer = []
  }

  initialize(): void {
    // バトル開始時は山札の上から3枚を初期手札として配る。最初のターン開始時ドローとは切り分け、カードの並びを固定できるようにする。
    this.turnValue.setState({
      turnCount: 1,
      activeSide: 'player',
      phase: 'player-draw',
    })
    this.playerValue.resetMana()
    this.drawForPlayer(3)
    this.pendingDrawAnimationEvents = []
  }

  startPlayerTurn(): void {
    this.turn.startPlayerTurn()
    this.enemyTeam.endTurn()
    this.enemyTeam.handlePlayerTurnStart(this)
    this.player.handlePlayerTurnStart(this)
    this.player.resetMana()
  }

  drawForPlayer(count: number): { drawn: number; skippedDueToHandLimit: boolean } {
    let drawn = 0
    let skippedDueToHandLimit = false
    const drawnCardIds: number[] = []

    for (let i = 0; i < count; i += 1) {
      if (this.hand.isAtLimit()) {
        skippedDueToHandLimit = true
        break
      }

      if (this.deck.size() === 0) {
        const reloaded = this.reloadDeckFromDiscard()
        if (!reloaded) {
          break
        }
      }

      const card = this.deck.drawOne(this.hand)
      if (!card) {
        skippedDueToHandLimit = this.hand.isAtLimit()
        break
      }

      drawn += 1
      if (card.id !== undefined) {
        drawnCardIds.push(card.id)
      }
    }

    if (drawnCardIds.length > 0 || skippedDueToHandLimit) {
      this.pendingDrawAnimationEvents.push({
        cardIds: drawnCardIds,
        drawnCount: drawn,
        handOverflow: skippedDueToHandLimit,
      })
    }

    return { drawn, skippedDueToHandLimit }
  }

  playCard(cardId: number, operations: CardOperation[] = []): void {
    if (this.turn.current.activeSide !== 'player') {
      throw new Error('It is not the player turn')
    }

    const card = this.hand.find(cardId)
    if (!card) {
      throw new Error(`Card ${cardId} not found in hand`)
    }
    card.play(this, operations)
  }

  endPlayerTurn(): void {
    this.turn.moveToPhase('player-end')
  }

  startEnemyTurn(): void {
    this.turn.startEnemyTurn()
    this.enemyTeam.startTurn(this)
  }

  performEnemyAction(enemyId: number): EnemyTurnActionSummary {
    const enemy = this.enemyTeam.findEnemy(enemyId)
    if (!enemy) {
      throw new Error(`Enemy ${enemyId} not found`)
    }

    const playerHpBefore = this.playerValue.currentHp
    const handBefore = this.handValue.list()
    const actionLogLengthBefore = enemy.actionLog.length
    const hadActedBeforeCall = enemy.hasActedThisTurn
    const enemyStatesBefore = this.captureEnemyStates()

    enemy.act(this)

    const actionLogLengthAfter = enemy.actionLog.length
    const handAfter = this.handValue.list()
    const damageToPlayer = Math.max(0, playerHpBefore - this.playerValue.currentHp)
    const cardsAddedToHand = this.extractNewHandCards(handBefore, handAfter)
    const damageAnimationEvents = this.consumeDamageAnimationEvents()
    const stateCardEvents = this.consumeStateCardAnimationEvents()
    const memoryCardEvents = this.consumeMemoryCardAnimationEvents()
    const stateDiffs = this.diffEnemyStates(enemyStatesBefore)
    const playerDefeated = this.playerValue.currentHp <= 0
    const snapshotAfter = this.cloneBattleSnapshot(this.captureFullSnapshot().snapshot)
    const lastActionMetadata = enemy.consumeLastActionMetadata()
    const forcedSkip = Boolean(lastActionMetadata?.skipped)
    let summary: EnemyTurnActionSummary
    if (forcedSkip) {
      const executedAction = enemy.actionLog[actionLogLengthAfter - 1]
      summary = {
        enemyId,
        enemyName: enemy.name,
        actionName: executedAction?.name ?? '行動不能',
        actionType: executedAction?.type,
        skipped: true,
        skipReason: (lastActionMetadata?.skipReason as EnemyTurnSkipReason | undefined) ?? 'no-target',
        cardsAddedToPlayerHand: cardsAddedToHand,
        damageToPlayer: damageToPlayer > 0 ? damageToPlayer : undefined,
        stateCardEvents:
          stateCardEvents.length > 0 ? this.cloneStateCardAnimationEvents(stateCardEvents) : undefined,
        memoryCardEvents:
          memoryCardEvents.length > 0 ? this.cloneMemoryCardAnimationEvents(memoryCardEvents) : undefined,
        animation: {
          damageEvents: [],
          cardAdditions: [],
          playerDefeated,
          stateDiffs: [],
        },
        snapshotAfter,
        metadata: lastActionMetadata ? { ...lastActionMetadata } : undefined,
      }
    } else if (actionLogLengthAfter > actionLogLengthBefore) {
      const executedAction = enemy.actionLog[actionLogLengthAfter - 1]
      if (!executedAction) {
        throw new Error('Enemy action log entry missing after execution')
      }
      summary = {
        enemyId,
        enemyName: enemy.name,
        actionName: executedAction.name,
        actionType: executedAction.type,
        skipped: false,
        cardsAddedToPlayerHand: cardsAddedToHand,
        damageToPlayer: damageToPlayer > 0 ? damageToPlayer : undefined,
        stateCardEvents:
          stateCardEvents.length > 0 ? this.cloneStateCardAnimationEvents(stateCardEvents) : undefined,
        memoryCardEvents:
          memoryCardEvents.length > 0 ? this.cloneMemoryCardAnimationEvents(memoryCardEvents) : undefined,
        animation: {
          damageEvents: damageAnimationEvents,
          cardAdditions: cardsAddedToHand,
          playerDefeated,
          stateDiffs,
        },
        snapshotAfter,
        metadata: lastActionMetadata ? { ...lastActionMetadata } : undefined,
      }
    } else {
      summary = {
        enemyId,
        enemyName: enemy.name,
        actionName: hadActedBeforeCall ? '行動済み' : '行動不能',
        skipped: true,
        skipReason: hadActedBeforeCall ? 'already-acted' : 'no-action',
        cardsAddedToPlayerHand: cardsAddedToHand,
        damageToPlayer: damageToPlayer > 0 ? damageToPlayer : undefined,
        stateCardEvents:
          stateCardEvents.length > 0 ? this.cloneStateCardAnimationEvents(stateCardEvents) : undefined,
        memoryCardEvents:
          memoryCardEvents.length > 0 ? this.cloneMemoryCardAnimationEvents(memoryCardEvents) : undefined,
        animation: {
          damageEvents: damageAnimationEvents,
          cardAdditions: cardsAddedToHand,
          playerDefeated,
          stateDiffs,
        },
        snapshotAfter,
        metadata: lastActionMetadata ? { ...lastActionMetadata } : undefined,
      }
    }

    return summary
  }

  private executeEnemyTurn(): EnemyTurnSummary {
    // 敵の行動はActionLogに直接保存せず、ターン終了エントリ解決時に都度再計算する方針のため、
    // ここで行動順に処理してサマリを保持する。
    this.startEnemyTurn()

    const actions: EnemyTurnActionSummary[] = []
    for (const enemyId of this.enemyTeam.turnOrder) {
      const enemy = this.enemyTeam.findEnemy(enemyId)
      if (!enemy) {
        continue
      }
      if (enemy.currentHp <= 0) {
        actions.push({
          enemyId,
          enemyName: enemy.name,
          actionName: '戦闘不能',
          skipped: true,
          skipReason: 'defeated',
          cardsAddedToPlayerHand: [],
          stateCardEvents: undefined,
          memoryCardEvents: undefined,
          snapshotAfter: this.cloneBattleSnapshot(this.captureFullSnapshot().snapshot),
        })
        continue
      }

      actions.push(this.performEnemyAction(enemyId))
    }

    const summary: EnemyTurnSummary = {
      actions,
    }
    this.lastEnemyTurnSummaryValue = summary
    return summary
  }

  recordDamageAnimation(event: DamageAnimationEvent): void {
    this.pendingDamageAnimationEvents.push({
      ...event,
      outcomes: event.outcomes.map((outcome) => ({ ...outcome })),
    })
  }

  recordCardTrashAnimation(event: {
    cardIds: number[]
    cardTitles?: string[]
    variant?: 'trash' | 'eliminate'
  }): void {
    if (!event.cardIds || event.cardIds.length === 0) {
      return
    }
    const uniqueIds = Array.from(new Set(event.cardIds))
    const titles = event.cardTitles && event.cardTitles.length > 0 ? [...event.cardTitles] : undefined
    this.pendingCardTrashAnimationEvents.push({
      cardIds: uniqueIds,
      cardTitles: titles,
      variant: event.variant ?? 'trash',
    })
  }

  recordManaAnimation(event: { amount: number }): void {
    if (!Number.isFinite(event.amount) || event.amount === 0) {
      return
    }
    this.pendingManaAnimationEvents.push({ amount: Math.trunc(event.amount) })
  }

  recordDefeatAnimation(enemyId: number): void {
    this.pendingDefeatAnimationEvents.push(enemyId)
  }

  recordStateCardAnimation(event: StateCardAnimationEvent): void {
    this.pendingStateCardAnimationEvents.push({
      ...event,
      cardIds: event.cardIds ? [...event.cardIds] : undefined,
      cardTitles: event.cardTitles ? [...event.cardTitles] : undefined,
    })
  }

  recordMemoryCardAnimation(event: MemoryCardAnimationEvent): void {
    this.pendingMemoryCardAnimationEvents.push({
      ...event,
      cardIds: event.cardIds ? [...event.cardIds] : undefined,
      cardTitles: event.cardTitles ? [...event.cardTitles] : undefined,
    })
  }

  consumeLastPlayCardAnimationContext(): PlayCardAnimationContext | undefined {
    const context = this.lastPlayCardAnimationContext
    this.lastPlayCardAnimationContext = undefined
    return context
  }

  recordPlayCardAnimationContext(context: PlayCardAnimationContext): void {
    this.lastPlayCardAnimationContext = {
      cardId: context.cardId,
      audio: context.audio,
      cutin: context.cutin,
      cardTags: context.cardTags ? [...context.cardTags] : undefined,
    }
  }

  private cloneEnemyActionSummary(action: EnemyTurnActionSummary): EnemyTurnActionSummary {
    return {
      ...action,
      cardsAddedToPlayerHand: action.cardsAddedToPlayerHand.map((card) => ({ ...card })),
      stateCardEvents: action.stateCardEvents
        ? this.cloneStateCardAnimationEvents(action.stateCardEvents)
        : undefined,
      memoryCardEvents: action.memoryCardEvents
        ? this.cloneMemoryCardAnimationEvents(action.memoryCardEvents)
        : undefined,
      animation: action.animation
        ? {
            damageEvents: action.animation.damageEvents.map((event) => ({
              ...event,
              outcomes: event.outcomes.map((outcome) => ({ ...outcome })),
            })),
            cardAdditions: action.animation.cardAdditions.map((card) => ({ ...card })),
            playerDefeated: action.animation.playerDefeated,
            stateDiffs: action.animation.stateDiffs.map((diff) => ({
              enemyId: diff.enemyId,
              states: diff.states.map((state) => ({ ...state })),
            })),
          }
        : undefined,
      snapshotAfter: this.cloneBattleSnapshot(action.snapshotAfter),
    }
  }

  consumeDamageAnimationEvents(): DamageAnimationEvent[] {
    const events = this.pendingDamageAnimationEvents
    this.pendingDamageAnimationEvents = []
    return events
  }

  consumeManaAnimationEvents(): Array<{ amount: number }> {
    const events = this.pendingManaAnimationEvents
    this.pendingManaAnimationEvents = []
    return events
  }

  consumeDefeatAnimationEvents(): number[] {
    const events = this.pendingDefeatAnimationEvents
    this.pendingDefeatAnimationEvents = []
    return events
  }

  consumeCardTrashAnimationEvents(): Array<{
    cardIds: number[]
    cardTitles?: string[]
    variant?: 'trash' | 'eliminate'
  }> {
    const events = this.pendingCardTrashAnimationEvents
    this.pendingCardTrashAnimationEvents = []
    return events.map((event) => ({
      cardIds: [...event.cardIds],
      cardTitles: event.cardTitles ? [...event.cardTitles] : undefined,
      variant: event.variant,
    }))
  }

  consumeDrawAnimationEvents(): Array<{ cardIds: number[]; drawnCount?: number; handOverflow?: boolean }> {
    const events = this.pendingDrawAnimationEvents
    this.pendingDrawAnimationEvents = []
    return events
  }

  consumeStateCardAnimationEvents(): StateCardAnimationEvent[] {
    const events = this.pendingStateCardAnimationEvents
    this.pendingStateCardAnimationEvents = []
    return events
  }

  consumeMemoryCardAnimationEvents(): MemoryCardAnimationEvent[] {
    const events = this.pendingMemoryCardAnimationEvents
    this.pendingMemoryCardAnimationEvents = []
    return events
  }

  private extractNewHandCards(before: Card[], after: Card[]): EnemyTurnActionCardGain[] {
    const beforeIds = new Set(before.map((card) => card.id))
    return after
      .filter((card) => {
        const cardId = card.id
        if (cardId === undefined) {
          // fallback to reference comparison when id is missing
          return !before.includes(card)
        }
        return !beforeIds.has(cardId)
      })
      .map((card) => ({
        id: card.id,
        title: card.title,
      }))
  }

  resolveEvents(): void {
    const currentTurn = this.turnValue.current.turnCount
    const readyEvents = this.eventsValue.extractReady(currentTurn)
    if (readyEvents.length > 0) {
      this.resolvedEventsBuffer = readyEvents.map((event) => ({
        ...event,
        payload: { ...event.payload },
      }))
    } else {
      this.resolvedEventsBuffer = []
    }

    for (const event of readyEvents) {
      this.applyEvent(event)
    }
  }

  enqueueEvent(event: BattleEvent): void {
    this.eventsValue.enqueue(event)
  }

  createEventId(): string {
    this.eventSequence += 1
    return `battle-event-${this.eventSequence}`
  }

  addLogEntry(entry: { message: string; metadata?: Record<string, unknown> }): void {
    const logEntry: BattleLogEntry = {
      id: `log-${this.logSequence + 1}`,
      message: entry.message,
      metadata: entry.metadata,
      turn: this.turnValue.current.turnCount,
      timestamp: new Date(),
    }
    this.logValue.record(logEntry)
    this.logSequence += 1
  }

  damagePlayer(amount: number, options?: { animation?: DamageAnimationEvent }): void {
    this.player.takeDamage(amount, { battle: this, animation: options?.animation })
    this.checkPlayerDefeat()
  }

  damageEnemy(enemy: Enemy, amount: number, options?: { animation?: DamageAnimationEvent }): void {
    enemy.takeDamage(amount, { battle: this, animation: options?.animation })
    this.checkEnemyTeamDefeat()
  }

  notifyActionResolved(details: { source: Player | Enemy; action: Action }): void {
    this.enemyTeam.handleActionResolved(this, details.source, details.action)
  }

  onEnemyStatusChanged(): void {
    this.checkEnemyTeamDefeat()
  }

  private captureEnemyStates(): Map<number, EnemyStateDiff['states']> {
    const map = new Map<number, EnemyStateDiff['states']>()
    for (const enemy of this.enemyTeamValue.members) {
      if (enemy.id === undefined) {
        continue
      }
      map.set(enemy.id, this.extractEnemyStateSummary(enemy))
    }
    return map
  }

  private extractEnemyStateSummary(enemy: Enemy): EnemyStateDiff['states'] {
    return enemy.getStates().map((state) => ({
      id: state.id,
      magnitude: this.getStateMagnitude(state),
    }))
  }

  private getStateMagnitude(state: State): number | undefined {
    const direct = (state as unknown as { magnitude?: number }).magnitude
    if (typeof direct === 'number') {
      return direct
    }
    const props = (state as unknown as { props?: { magnitude?: number } }).props
    return props?.magnitude
  }

  private diffEnemyStates(before: Map<number, EnemyStateDiff['states']>): EnemyStateDiff[] {
    const diffs: EnemyStateDiff[] = []
    for (const enemy of this.enemyTeamValue.members) {
      const id = enemy.id
      if (id === undefined) {
        continue
      }
      const previous = before.get(id) ?? []
      const current = this.extractEnemyStateSummary(enemy)
      if (!this.areStateSummariesEqual(previous, current)) {
        diffs.push({ enemyId: id, states: current })
      }
    }
    return diffs
  }

  private areStateSummariesEqual(
    previous: EnemyStateDiff['states'],
    current: EnemyStateDiff['states'],
  ): boolean {
    if (previous.length !== current.length) {
      return false
    }
    const normalize = (states: EnemyStateDiff['states']) =>
      [...states]
        .map(({ id, magnitude }) => `${id}:${magnitude ?? 0}`)
        .sort()
    const prevKey = normalize(previous)
    const currKey = normalize(current)
    return prevKey.every((value, index) => value === currKey[index])
  }

  addCardToPlayerHand(card: Card): void {
    if (this.hand.add(card)) {
      return
    }

    const replacement = this.hand.removeOldest((candidate) => candidate.definition.cardType !== 'status')
    if (replacement) {
      this.discardPileValue.add(replacement)
      this.hand.add(card)
      return
    }

    this.discardPileValue.add(card)
  }

  executeActionLog(actionLog: ActionLog, targetIndex?: number): void {
    const lastIndex = targetIndex ?? actionLog.length - 1
    if (lastIndex < this.executedActionLogIndex) {
      throw new Error('指定されたActionLogのインデックスは現在の進行度より小さいため、巻き戻しには新しいBattleインスタンスを使用してください。')
    }
    this.lastEnemyTurnSummaryValue = undefined

    for (let index = this.executedActionLogIndex + 1; index <= lastIndex; index += 1) {
      const entry = actionLog.at(index)
      if (!entry) {
        throw new Error(`ActionLogのエントリが見つかりません: index=${index}`)
      }

      this.applyActionLogEntry(actionLog, entry)
      this.executedActionLogIndex = index
    }

  }

  private applyActionLogEntry(actionLog: ActionLog, entry: BattleActionLogEntry): void {
    switch (entry.type) {
      case 'battle-start':
        this.initialize()
        break
      case 'start-player-turn':
        this.startPlayerTurn()
        if (entry.draw && entry.draw > 0) {
          this.drawForPlayer(entry.draw)
        }
        this.resolveEvents()
        this.enemyTeam.planUpcomingActions(this)
        break
      case 'play-card': {
        const cardId = actionLog.resolveValue(entry.card, this)
        const operations =
          entry.operations?.map((operation) => ({
            type: operation.type,
            payload:
              operation.payload === undefined
                ? undefined
                : actionLog.resolveValue(operation.payload, this),
          })) ?? []
        this.playCard(cardId, operations)
        break
      }
      case 'player-event':
      case 'enemy-act':
      case 'state-event':
        // TODO: 新しいActionLogエントリ種別に対応した盤面更新を実装する
        break
      case 'end-player-turn': {
        this.endPlayerTurn()
        this.markEntrySnapshotBoundary()
        this.executeEnemyTurn()
        break
      }
      case 'victory':
        this.recordOutcome('victory')
        break
      case 'gameover':
        this.recordOutcome('gameover')
        break
      default:
        throw new Error(`未対応のActionLogエントリ type=${(entry as { type: string }).type}`)
    }
  }

  private applyEvent(event: BattleEvent): void {
    switch (event.type) {
      case 'mana': {
        const rawAmount = (event.payload as { amount?: unknown }).amount
        const amount = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount ?? 0)
        if (Number.isFinite(amount) && amount !== 0) {
          this.player.gainTemporaryMana(amount, { battle: this, trackAnimation: false })
        }
        break
      }
      case 'custom':
        this.handleCustomEvent(event)
        break
      default:
        break
    }
  }

  private handleCustomEvent(event: BattleEvent): void {
    const payload = event.payload as { action?: unknown; cardId?: unknown; tagId?: unknown }
    if (payload?.action !== 'remove-card-tag') {
      return
    }

    const rawCardId = payload.cardId
    const rawTagId = payload.tagId
    const cardId = typeof rawCardId === 'number' ? rawCardId : Number(rawCardId)
    const tagId = typeof rawTagId === 'string' ? rawTagId : String(rawTagId ?? '')

    if (!Number.isInteger(cardId) || tagId.length === 0) {
      return
    }

    const card = this.cardRepositoryValue.findById(cardId)
    if (!card) {
      return
    }
    card.removeTemporaryTag(tagId)
  }

  private reloadDeckFromDiscard(): boolean {
    const discardCards = this.discardPileValue.takeAll()
    if (discardCards.length === 0) {
      return false
    }

    const reordered = this.reorderDiscardForReshuffle(discardCards)
    this.deckValue.addManyToBottom(reordered)
    return true
  }

  private reorderDiscardForReshuffle(cards: Card[]): Card[] {
    if (cards.length <= 1) {
      return cards
    }

    const acidMemories = cards.filter(
      (card) => this.isMemoryCard(card) && card.action?.name === '酸を吐く',
    )
    const others = cards.filter(
      (card) => !(this.isMemoryCard(card) && card.action?.name === '酸を吐く'),
    )

    return [...acidMemories, ...others]
  }

  private isMemoryCard(card: Card): boolean {
    return (card.cardTags ?? []).some((tag) => tag.id === 'tag-memory')
  }

  private cloneStateCardAnimationEvents(events: StateCardAnimationEvent[]): StateCardAnimationEvent[] {
    return events.map((event) => ({
      ...event,
      cardIds: event.cardIds ? [...event.cardIds] : undefined,
      cardTitles: event.cardTitles ? [...event.cardTitles] : undefined,
    }))
  }

  private cloneMemoryCardAnimationEvents(events: MemoryCardAnimationEvent[]): MemoryCardAnimationEvent[] {
    return events.map((event) => ({
      ...event,
      cardIds: event.cardIds ? [...event.cardIds] : undefined,
      cardTitles: event.cardTitles ? [...event.cardTitles] : undefined,
    }))
  }

  private applyCardRuntimeCost(card: Card): Card {
    const computedCost = card.calculateCost({
      battle: this,
      source: this.playerValue,
      cardTags: card.cardTags ?? [],
    })
    card.setRuntimeCost(computedCost)
    return card
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
      events: source.events.map((event) => ({
        ...event,
        payload:
          event.payload && typeof event.payload === 'object'
            ? { ...(event.payload as Record<string, unknown>) }
            : event.payload,
      })),
      turn: { ...source.turn },
      log: source.log.map((entry) => ({ ...entry })),
      status: source.status,
    }
  }

  private buildRelicInstances(
    classNames: string[],
    states: Array<{ className: string; state: unknown }> | undefined,
  ): Relic[] {
    return classNames
      .map((className) => {
        const relic = instantiateRelic(className)
        if (!relic) return null
        const saved = states?.find((entry) => entry.className === className)
        if (saved) {
          relic.restoreState(saved.state)
        }
        return relic
      })
      .filter((relic): relic is Relic => relic !== null)
  }

  private rebuildRelics(
    classNames: string[],
    states: Array<{ className: string; state: unknown }> | undefined,
  ): void {
    this.relicClassNames = [...classNames]
    this.relicInstances = this.buildRelicInstances(this.relicClassNames, states)
  }

  private recordOutcome(outcome: BattleStatus): void {
    if (this.statusValue !== 'in-progress') {
      return
    }

    this.statusValue = outcome
  }

  private checkPlayerDefeat(): void {
    if (this.playerValue.currentHp <= 0) {
      this.recordOutcome('gameover')
    }
  }

  private checkEnemyTeamDefeat(): void {
    if (this.enemyTeamValue.areAllDefeated()) {
      this.recordOutcome('victory')
    }
  }
}
