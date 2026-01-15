
import { Card } from '../entities/Card'
import type { CardOperation } from '../entities/operations'
import type { Player } from '../entities/Player'
import type { Enemy, EnemyQueueSnapshot, EnemyStatus } from '../entities/Enemy'
import type { EnemyTeam } from '../entities/EnemyTeam'
import type { Action, ActionAudioCue, ActionContext, ActionCutInCue } from '../entities/Action'
import type { ActionPlanSnapshot } from '../entities/Action/ActionBase'
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
import type { DamageEffectType, DamageOutcome, DamagePattern } from '../entities/Damages'
import type { CardId } from '../library/Library'
import type { EnemySkill, StateSnapshot, StateCategory } from '@/types/battle'
import { instantiateRelic } from '../entities/relics/relicLibrary'
import type { Relic, RelicUsageType } from '../entities/relics/Relic'
import { ActiveRelic } from '../entities/relics/ActiveRelic'
import type { RelicId } from '../entities/relics/relicTypes'
import { instantiateStateFromSnapshot, MiasmaState } from '../entities/states'
import { isPredictionDisabled } from '../utils/predictionToggle'
import { AchievementProgressManager } from '../achievements/AchievementProgressManager'
import { ORC_HERO_TEAM_ID } from '../achievements/constants'
// ターン終了時の手札保持ルールは「保留」タグで一元管理する。
const RETAIN_CARD_TAG_ID = 'tag-retain'
const DEBUG_RELIC_USABLE_LOG =
  (typeof process !== 'undefined' && process.env?.VITE_DEBUG_RELIC_USABLE_LOG === 'true') ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEBUG_RELIC_USABLE_LOG === 'true')

export type BattleStatus = 'in-progress' | 'victory' | 'gameover'

export type BattleTurnSide = 'player' | 'enemy'

export interface BattleTurn {
  /** 1-based のターン番号（先制行動に 0 を使う余地を残す） */
  turn: number
  /** 現在行動中のサイド */
  side: BattleTurnSide
}

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
  achievementProgressManager?: AchievementProgressManager
}

export interface BattleSnapshotRelic {
  className: string
  id: RelicId
  name: string
  usageType: RelicUsageType
  active: boolean
  usesRemaining?: number | null
  manaCost?: number | null
  usable?: boolean
}

export interface BattleSnapshot {
  id: string
  /** 現在のターン位置。先制行動などに備え turn=0 も許容する。 */
  turnPosition: BattleTurn
  player: {
    id: string
    name: string
    currentHp: number
    maxHp: number
    /** プレイヤーターン中に、即「ターン終了」した場合の予測HP。入力待ち時のみ算出する。 */
    predictedPlayerHpAfterEndTurn?: number
    currentMana: number
    maxMana: number
    relics: BattleSnapshotRelic[]
    states?: StateSnapshot[]
  }
  enemies: Array<{
    id: number
    name: string
    level?: number
    image: string
    currentHp: number
    maxHp: number
    states: StateSnapshot[]
    hasActedThisTurn: boolean
    status: EnemyStatus
    skills: EnemySkill[]
    plannedActions?: Array<{
      turn: number
      actionName: string
      actionType: ActionType
      plan?: ActionPlanSnapshot
    }>
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

export type EnemyTurnSkipReason = 'already-acted' | 'no-action' | 'defeated' | 'no-target' | 'escaped'

export interface EnemyStateDiff {
  enemyId: number
  states: Array<
    | { id: string; stackable: true; magnitude: number }
    | { id: string; stackable: false; magnitude?: undefined }
  >
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
  damageEvents: DamageEvent[]
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

export type Actor = { type: 'player' } | { type: 'enemy'; enemyId: number }

export interface DamageEvent {
  actionId: CardId
  attacker: Actor | null
  defender: Actor
  outcomes: DamageOutcome[]
  effectType?: DamageEffectType
  damagePattern?: DamagePattern
  baseCount?: number
}

export interface PlayCardAnimationContext {
  cardId?: number
  audio?: ActionAudioCue
  cutin?: ActionCutInCue
  cardTags?: string[]
}

export interface PlayRelicAnimationContext {
  relicId?: RelicId
  audio?: ActionAudioCue
  cutin?: ActionCutInCue
}

export class Battle {
  private readonly idValue: string
  private readonly playerValue: Player
  private readonly enemyTeamValue: EnemyTeam
  private readonly deckValue: Deck
  private readonly handValue: Hand
  private readonly discardPileValue: DiscardPile
  private readonly exilePileValue: ExilePile
  /** ViewManager などが入力ロックを反映するための簡易フラグ。Snapshot生成時の予測に利用。 */
  private inputLocked = false
  /** プレイヤーターンで算出した予測値を敵フェーズ中も保持するためのキャッシュ。 */
  private cachedPredictedPlayerHpAfterEndTurn: number | undefined
  /** OperationRunner などが提供する予測計算デリゲート */
  private predictionDelegate?: () => number | undefined
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
  private pendingDamageAnimationEvents: DamageEvent[] = []
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
  private pendingDiscardDrawAnimationEvents: Array<{
    cardIds: number[]
    handOverflow?: boolean
  }> = []
  private pendingStateCardAnimationEvents: StateCardAnimationEvent[] = []
  private pendingMemoryCardAnimationEvents: MemoryCardAnimationEvent[] = []
  private interruptEnemyActionQueue: QueuedInterruptEnemyAction[] = []
  private lastPlayCardAnimationContext?: PlayCardAnimationContext
  private lastPlayRelicAnimationContext?: PlayRelicAnimationContext
  private pendingEntrySnapshotOverride?: BattleSnapshot
  /** 実績進行度をバトル単位で集計するマネージャ。 */
  readonly achievementProgressManager?: AchievementProgressManager

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
    this.achievementProgressManager = config.achievementProgressManager
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

  /** 実績進行度: rememberState で状態異常カードを獲得したイベントを記録する。 */
  recordAchievementStatusCardMemory(): void {
    this.achievementProgressManager?.recordStatusCardMemory()
  }

  /** 実績進行度: State付与を通知し、腐食や粘液の累計として集計する。 */
  recordAchievementStateApplied(state: unknown): void {
    this.achievementProgressManager?.recordStateApplied(state)
  }

  /** 実績進行度: カードプレイを通知し、カード種別に応じて Manager がカウントする。 */
  recordAchievementCardPlayed(card: import('@/domain/entities/Card').Card): void {
    this.achievementProgressManager?.recordCardPlayed(card)
  }

  /** 実績進行度: プレイヤーがダメージを受けた際の情報を通知する。 */
  recordAchievementDamageTaken(event: DamageEvent): void {
    const totalDamage = event.outcomes.reduce(
      (sum, outcome) => sum + Math.max(0, Math.floor(outcome.damage)),
      0,
    )
    this.achievementProgressManager?.recordDamageTaken({
      totalDamage,
      damagePattern: event.damagePattern,
      baseCount: event.baseCount,
      effectType: event.effectType,
    })
  }

  /** 実績進行度: 敗北を通知する。 */
  recordAchievementDefeat(): void {
    this.achievementProgressManager?.recordDefeat()
  }

  /** 実績進行度: オークヒーロー撃破（チーム単位）を通知する。 */
  recordAchievementOrcHeroDefeated(): void {
    this.achievementProgressManager?.recordOrcHeroDefeated()
  }

  /** ViewManager が入力ロック/解除を伝えるための API。Snapshot 時の予測計算に利用。 */
  setInputLocked(locked: boolean): void {
    this.inputLocked = locked
  }

  /**
   * 現在のターン位置を Battle インスタンスから直接参照したいケース向けの簡易ゲッター。
   * スナップショットを介さず、最新状態の turn/side を取得する。
   */
  get turnPosition(): BattleTurn {
    return {
      turn: this.turnValue.current.turnCount,
      side: this.turnValue.current.activeSide,
    }
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

  /**
   * 「今すぐターン終了したらプレイヤーHPはいくつ残るか」を予測する。
   * OperationRunner などから委譲されたデリゲートを用いて、ログ再生込みで計算する。
   */
  private predictPlayerHpAfterEndTurn(): number | undefined {
    if (isPredictionDisabled()) {
      this.cachedPredictedPlayerHpAfterEndTurn = undefined
      return undefined
    }
    if (this.turnValue.current.activeSide === 'enemy') {
      return this.cachedPredictedPlayerHpAfterEndTurn ?? this.playerValue.currentHp
    }
    if (this.predictionDelegate) {
      try {
        const predicted = this.predictionDelegate()
        if (typeof predicted === 'number') {
          this.cachedPredictedPlayerHpAfterEndTurn = predicted
          return predicted
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('[Battle] predictPlayerHpAfterEndTurn via delegate failed', error)
      }
    }
    return undefined
  }

  getSnapshot(options?: { includePrediction?: boolean }): BattleSnapshot {
    const includePrediction = options?.includePrediction !== false
    const teamId = this.enemyTeamValue.id
    const relicSnapshots =
      this.relicInstances.map((relic) => this.buildRelicSnapshotEntry(relic)) ?? []
    if (DEBUG_RELIC_USABLE_LOG) {
      // eslint-disable-next-line no-console
      console.info('[Battle.getSnapshot] relics', {
        inputLocked: this.inputLocked,
        turnSide: this.turnValue.current.activeSide,
        playerMana: this.playerValue.currentMana,
        relics: relicSnapshots.map((entry) => ({
          id: entry.id,
          usable: entry.usable,
          usesRemaining: entry.usesRemaining,
          manaCost: entry.manaCost,
        })),
      })
    }

    const deckWithCost = this.deckValue.list()
    const handWithRuntime = this.handValue.list().map((card) => this.applyCardRuntime(card))
    const discardWithCost = this.discardPileValue.list()
    const exileWithCost = this.exilePileValue.list()
    const predictedHp =
      includePrediction && !isPredictionDisabled()
        ? this.turnValue.current.activeSide === 'player'
          ? this.predictPlayerHpAfterEndTurn()
          : this.cachedPredictedPlayerHpAfterEndTurn ?? this.playerValue.currentHp
        : undefined

    return {
      id: this.idValue,
      turnPosition: {
        turn: this.turnValue.current.turnCount,
        side: this.turnValue.current.activeSide,
      },
      player: {
        id: this.playerValue.id,
        name: this.playerValue.name,
        currentHp: this.playerValue.currentHp,
        maxHp: this.playerValue.maxHp,
        predictedPlayerHpAfterEndTurn: predictedHp,
        currentMana: this.playerValue.currentMana,
        maxMana: this.playerValue.maxMana,
        relics: relicSnapshots,
        states: this.playerValue.getStates(this).map((state) => this.buildStateSnapshot(state)),
      },
      enemies: this.enemyTeamValue.members.map<BattleSnapshot['enemies'][number]>((enemy: Enemy) => {
        const id = enemy.id
        if (id === undefined) {
          throw new Error(`Enemy ${enemy.name} has no repository id`)
        }

        return {
          id,
          name: enemy.name,
          level: enemy.level,
          image: enemy.image,
          currentHp: enemy.currentHp,
          maxHp: enemy.maxHp,
          states: enemy.states.map((state) => this.buildStateSnapshot(state, teamId)),
          hasActedThisTurn: enemy.hasActedThisTurn,
          status: enemy.status,
          skills: enemy.actions.map((action) => ({
            name: action.name,
            detail: action.describe(),
          })),
          plannedActions: enemy.queuedActionEntries.map((entry) => ({
            turn: entry.turn,
            actionName: entry.action.name,
            actionType: entry.action.type,
            plan: entry.plan ? { ...entry.plan } : undefined,
          })),
        }
      }),
      deck: deckWithCost,
      hand: handWithRuntime,
      discardPile: discardWithCost,
      exilePile: exileWithCost,
      events: this.eventsValue.list(),
      turn: this.turnValue.current,
      log: this.logValue.list(),
      status: this.statusValue,
    }
  }

  private buildRelicSnapshotEntry(relic: Relic): BattleSnapshotRelic {
    const active = relic.isActive({ battle: this, player: this.playerValue })
    const usageType = relic.usageType
    if (usageType === 'active' && relic instanceof ActiveRelic) {
      const usesRemaining = relic.getUsesRemaining()
      const manaCost = relic.manaCost ?? null
      // プレイヤーターンかつ入力ロックなし、かつ canActivate が true の場合にのみ usable を true にする。
      const canUseNow =
        this.turnValue.current.activeSide === 'player' &&
        !this.inputLocked &&
        this.statusValue === 'in-progress' &&
        relic.canActivate({ battle: this, player: this.playerValue })
      if (DEBUG_RELIC_USABLE_LOG) {
        // eslint-disable-next-line no-console
        console.info('[Battle.buildRelicSnapshotEntry]', {
          relicId: relic.id,
          active,
          canUseNow,
          inputLocked: this.inputLocked,
          turnSide: this.turnValue.current.activeSide,
          playerMana: this.playerValue.currentMana,
          usesRemaining,
          manaCost,
        })
      }
      return {
        className: relic.constructor.name,
        id: relic.id,
        name: relic.name,
        usageType,
        active,
        usesRemaining,
        manaCost,
        usable: canUseNow,
      }
    }

    return {
      className: relic.constructor.name,
      id: relic.id,
      name: relic.name,
      usageType,
      active,
      usable: active,
    }
  }

  private buildStateSnapshot(state: State, teamId?: string): StateSnapshot {
    // state がプレーンオブジェクト化しているケースでも落ちないようガードする
    const category: StateCategory = state.getCategory()
    const importantFromTeam = teamId ? this.isImportantStateForTeam(teamId, state.id) : false
    const description = typeof state.description === 'function' ? state.description() : String((state as any).description ?? '')
    const isImportant = importantFromTeam || (typeof state.isImportant === 'function' ? state.isImportant() : false)
    const stackable = typeof state.isStackable === 'function' ? state.isStackable() : false

    if (stackable) {
      return {
        id: state.id,
        name: state.name,
        description,
        category,
        isImportant,
        stackable: true,
        magnitude: state.magnitude ?? 0,
        icon: state.icon,
      }
    }

    return {
      id: state.id,
      name: state.name,
      description,
      category,
      isImportant,
      stackable: false,
      magnitude: undefined,
      icon: state.icon,
    }
  }

  private isImportantStateForTeam(teamId: string, stateId: string): boolean {
    const table: Record<string, readonly string[]> = {
      'enemy-team-snail-encounter': ['state-hard-shell'],
      'enemy-team-test-encounter': ['state-hard-shell'],
      'enemy-team-hummingbird-allies': ['state-flight'],
      'enemy-team-iron-bloom': ['state-guardian-petal'],
      'enemy-team-orc-hero-elite': ['state-large', 'state-fury-awakening'],
    }
    const list = table[teamId]
    return list ? list.includes(stateId) : false
  }

  captureFullSnapshot(): FullBattleSnapshot {
    // 予測値も含めたスナップショットを保持する
    const base = this.getSnapshot({ includePrediction: true })
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

  /**
   * 指定した id のレリックを所持しているか判定する（active かどうかは問わない）。
   */
  hasRelic(relicId: RelicId): boolean {
    return this.relicInstances.some((relic) => relic.id === relicId)
  }

  /**
   * 指定した id のレリックインスタンスを取得する（見つからなければ undefined）。
   */
  getRelicById(relicId: RelicId): Relic | undefined {
    return this.relicInstances.find((relic) => relic.id === relicId)
  }

  /**
   * 指定した id のレリックを所持し、かつ isActive が true か判定する。
   */
  hasActiveRelic(relicId: RelicId): boolean {
    return this.relicInstances.some((relic) => relic.id === relicId && relic.isActive({ battle: this, player: this.playerValue }))
  }

  setPredictionDelegate(delegate?: () => number | undefined): void {
    this.predictionDelegate = delegate
  }

  restoreFullSnapshot(state: FullBattleSnapshot): void {
    const base = state.snapshot
    this.statusValue = base.status
    this.cachedPredictedPlayerHpAfterEndTurn = base.player.predictedPlayerHpAfterEndTurn
    this.playerValue.setCurrentHp(base.player.currentHp)
    this.playerValue.setCurrentMana(base.player.currentMana)
    // プレイヤーのステートをスナップショットに合わせて再構築する
    const revivedPlayerStates = this.reviveStatesStrict(base.player.states, 'player')
    this.playerValue.replaceBaseStates(revivedPlayerStates)

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
      enemy.replaceStates(this.reviveStatesStrict(enemySnapshot.states, `enemy:${enemySnapshot.id}`))
      const queueState = state.enemyQueues.find((entry) => entry.enemyId === enemySnapshot.id)
      if (queueState) {
        enemy.restoreQueueSnapshot(queueState.queue)
      }
    }

    this.resolvedEventsBuffer = []
    this.stateEventBuffer = []
  }

  private reviveStatesStrict(states: StateSnapshot[] | undefined, context: string): State[] {
    if (!states) {
      throw new Error(`[Battle] State snapshots missing for ${context}`)
    }
    const revived = states
      .map((entry) => instantiateStateFromSnapshot(entry))
      .filter((entry): entry is State => Boolean(entry))
    if (states.length > 0 && revived.length === 0) {
      const ids = states.map((entry) => entry.id ?? 'undefined').join(', ')
      throw new Error(`[Battle] Failed to revive states for ${context}. ids=[${ids}]`)
    }
    return revived
  }

  initialize(): void {
    // バトル開始時は山札の上から3枚を初期手札として配る。最初のターン開始時ドローとは切り分け、カードの並びを固定できるようにする。
    this.turnValue.setState({
      turnCount: 1,
      activeSide: 'player',
      phase: 'player-draw',
    })
    this.playerValue.resetMana()
    const initialDraw = this.playerValue.calculateInitialDraw(this)
    this.drawForPlayer(initialDraw)
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

  /**
   * 捨て札から指定カードを手札へ戻すユーティリティ。
   * - 呼び出し元で抽選済みのカードを受け取り、手札上限チェックと移動のみを担当する。
   * - handOverflow 時はアニメーションイベントのみ積み、カードは移動しない。
   */
  drawFromDiscard(card: Card): { movedCard?: Card; handOverflow: boolean } {
    if (this.hand.isAtLimit()) {
      this.pendingDiscardDrawAnimationEvents.push({ cardIds: [], handOverflow: true })
      return { handOverflow: true }
    }

    const discardCards = this.discardPile.list()
    const index = discardCards.findIndex(
      (candidate) => candidate === card || (card.id !== undefined && candidate.id === card.id),
    )
    if (index === -1) {
      return { handOverflow: false }
    }

    const removed = discardCards.splice(index, 1)
    const selected = removed[0]
    if (!selected) {
      return { handOverflow: false }
    }
    this.discardPile.replace(discardCards)

    const added = this.hand.add(selected)
    if (!added) {
      // 想定外だが、同フレームで手札が埋まった場合は捨て札へ戻して終了
      this.discardPile.add(selected)
      return { handOverflow: true }
    }

    if (selected.id !== undefined) {
      this.pendingDiscardDrawAnimationEvents.push({ cardIds: [selected.id] })
    }

    return { movedCard: selected, handOverflow: false }
  }

  playCard(cardId: number, operations: CardOperation[] = []): void {
    if (this.turn.current.activeSide !== 'player') {
      throw new Error('It is not the player turn')
    }

    const card = this.hand.find(cardId)
    if (!card) {
      throw new Error(`Card ${cardId} not found in hand`)
    }
    this.recordAchievementCardPlayed(card)
    card.play(this, operations)
  }

  playRelic(relicId: RelicId, operations: CardOperation[] = []): void {
    if (this.turn.current.activeSide !== 'player') {
      throw new Error('It is not the player turn')
    }
    if (this.inputLocked) {
      throw new Error('Input is locked')
    }

    const relic = this.getRelicById(relicId)
    if (!relic) {
      throw new Error(`Relic ${relicId} not found`)
    }
    if (!(relic instanceof ActiveRelic)) {
      throw new Error(`Relic ${relicId} is not activatable`)
    }

    const context = { battle: this, player: this.playerValue }
    const usableNow =
      this.turnValue.current.activeSide === 'player' &&
      !this.inputLocked &&
      this.statusValue === 'in-progress' &&
      relic.canActivate(context)

    if (!usableNow) {
      throw new Error(`Relic ${relicId} cannot be activated now`)
    }

    relic.perform(context, operations)
  }

  endPlayerTurn(): void {
    if (this.isDebugEnemyActedLogEnabled()) {
      // eslint-disable-next-line no-console
      console.log('[Battle] endPlayerTurn')
    }
    // 手札ルールはexperimentalをデフォルトとし、ターン終了時は「保留」以外を捨て札へ送る
    this.discardNonRetainHandCards()
    this.turn.moveToPhase('player-end')
  }

  startEnemyTurn(): void {
    if (this.isDebugEnemyActedLogEnabled()) {
      // eslint-disable-next-line no-console
      console.log('[Battle] startEnemyTurn', {
        turn: this.turnPosition.turn,
        side: this.turnPosition.side,
      })
    }
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
    if (this.isDebugEnemyActedLogEnabled()) {
      // eslint-disable-next-line no-console
      console.log('[Battle] executeEnemyTurn start', {
        turn: this.turnPosition.turn,
        side: this.turnPosition.side,
      })
    }
    // 敵の行動はActionLogに直接保存せず、ターン終了エントリ解決時に都度再計算する方針のため、
    // ここで行動順に処理してサマリを保持する。
    this.startEnemyTurn()

    const actions: EnemyTurnActionSummary[] = []
    for (const enemyId of this.enemyTeam.turnOrder) {
      const enemy = this.enemyTeam.findEnemy(enemyId)
      if (!enemy) {
        continue
      }
      if (!enemy.isActive()) {
        // 撃破/逃走済みの敵は「行動スキップ」の enemy-act を生成しない。
        // 生成してしまうと View 側の最低待機時間により無意味な待ちが発生するため、ターン順処理のみスキップする。
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

  private isDebugEnemyActedLogEnabled(): boolean {
    return (
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_DEBUG_ENEMY_ACTED === 'true') ||
      (typeof process !== 'undefined' && process.env?.VITE_DEBUG_ENEMY_ACTED === 'true')
    )
  }

  recordDamageAnimation(event: DamageEvent): void {
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

  consumeLastPlayRelicAnimationContext(): PlayRelicAnimationContext | undefined {
    const context = this.lastPlayRelicAnimationContext
    this.lastPlayRelicAnimationContext = undefined
    return context
  }

  recordPlayRelicAnimationContext(context: PlayRelicAnimationContext): void {
    const cutin = context.cutin
    this.lastPlayRelicAnimationContext = {
      relicId: context.relicId,
      audio:
        context.audio && typeof context.audio.soundId === 'string' && context.audio.soundId.length > 0
          ? {
              soundId: context.audio.soundId,
              waitMs: typeof context.audio.waitMs === 'number' ? context.audio.waitMs : undefined,
              durationMs:
                typeof context.audio.durationMs === 'number' ? context.audio.durationMs : context.audio.waitMs,
            }
          : undefined,
      // カットインは src が空のときは無視し、必要最低限の情報だけをコピーしておく
      cutin:
        cutin && typeof cutin.src === 'string' && cutin.src.length > 0
          ? {
              src: cutin.src,
              waitMs: typeof cutin.waitMs === 'number' ? cutin.waitMs : undefined,
              durationMs: typeof cutin.durationMs === 'number' ? cutin.durationMs : undefined,
            }
          : undefined,
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

  consumeDamageAnimationEvents(): DamageEvent[] {
    const events = this.pendingDamageAnimationEvents
    this.pendingDamageAnimationEvents = []
    return events
  }

  /**
   * プレイヤー被弾に反応する同期ダメージ用の拡張ポイント。
   * - 具体的なロジックは今後実装する。
   */
  handlePlayerDamageReactions(_event: DamageEvent): void {
    if (_event.defender.type !== 'player') {
      return
    }

    const reactions: DamageEvent[] = []

    // ダメージ連動: このStateを持つ敵全員へ同じダメージを同期
    for (const enemy of this.enemyTeam.members) {
      if (!enemy.isActive() || enemy.id === undefined) continue
      const hasLink = enemy.getStates().some((state) => state.id === 'state-damage-link')
      if (!hasLink) continue
      reactions.push({
        actionId: 'damage-link',
        attacker: _event.attacker,
        defender: { type: 'enemy', enemyId: enemy.id },
        outcomes: _event.outcomes.map((outcome) => ({ ...outcome })),
        effectType: _event.effectType ?? 'linked-damage',
      })
    }

    // 瘴気: プレイヤーに付与されていて、攻撃者が敵の場合に発火
    const miasma = this.playerValue.getStates(this).find((state) => state.id === 'state-miasma') as MiasmaState | undefined
    if (miasma && _event.attacker?.type === 'enemy') {
      const mag = Math.max(0, Math.floor(miasma.magnitude ?? 0))
      if (mag > 0) {
        const hits = Math.max(1, _event.outcomes.length || 1)
        const outcomes = Array.from({ length: hits }, () => ({ damage: mag, effectType: 'miasma' as const }))
        reactions.push({
          actionId: 'miasma',
          attacker: { type: 'player' },
          defender: { type: 'enemy', enemyId: _event.attacker.enemyId },
          outcomes,
          effectType: 'miasma',
        })
      }
    }

    reactions.forEach((event) => {
      if (event.defender.type !== 'enemy') {
        return
      }
      const target = this.enemyTeam.findEnemy(event.defender.enemyId)
      if (!target || !target.isActive()) {
        return
      }
      // ダメージ適用時に outomes を複製し、アニメーションと実ダメージを同期させる
      this.damageEnemy(target, {
        ...event,
        outcomes: event.outcomes.map((outcome) => ({ ...outcome })),
      })
    })
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

  /**
   * 手札追加を deck-draw 演出で扱うためのアニメーションイベントを積む。
   */
  recordDrawAnimation(event: { cardIds: number[]; drawnCount?: number; handOverflow?: boolean }): void {
    if (!event.cardIds || event.cardIds.length === 0) {
      return
    }
    this.pendingDrawAnimationEvents.push({
      cardIds: [...event.cardIds],
      drawnCount: event.drawnCount,
      handOverflow: event.handOverflow,
    })
  }

  consumeDiscardDrawAnimationEvents(): Array<{ cardIds: number[]; handOverflow?: boolean }> {
    const events = this.pendingDiscardDrawAnimationEvents
    this.pendingDiscardDrawAnimationEvents = []
    return events
  }

  consumeStateCardAnimationEvents(): StateCardAnimationEvent[] {
    const events = this.pendingStateCardAnimationEvents
    this.pendingStateCardAnimationEvents = []
    return events
  }

  /**
   * 攻撃者IDなどを含むダメージイベントから同期ダメージを積む際に利用するメソッドの骨組み。
   * - 具体的な同期ダメージ積み込みは今後実装する。
   */
  scheduleSynchronizedEnemyDamage(_event: DamageEvent): void {
    // TODO: player-damage に合わせて enemy-damage を積むロジックを実装
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

  damagePlayer(event: DamageEvent): void {
    this.player.takeDamage(event, { battle: this, animation: event })
    this.checkPlayerDefeat()
  }

  damageEnemy(enemy: Enemy, event: DamageEvent): void {
    enemy.takeDamage(event, { battle: this, animation: event })
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
    return enemy.getStates().map((state) => {
      const stackable = typeof state.isStackable === 'function' ? state.isStackable() : false
      if (stackable) {
        return { id: state.id, stackable: true, magnitude: state.magnitude ?? 0 }
      }
      return { id: state.id, stackable: false, magnitude: undefined }
    })
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
        .map(({ id, magnitude, stackable }) =>
          `${id}:${stackable ? String(magnitude ?? 0) : 'nostack'}`,
        )
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

  private discardNonRetainHandCards(): void {
    const targets = this.handValue.list().filter((card) => !card.hasTag(RETAIN_CARD_TAG_ID))
    if (targets.length === 0) {
      return
    }

    targets.forEach((card) => {
      this.handValue.remove(card)
      this.discardPileValue.add(card)
    })

    const cardIds = targets
      .map((card) => card.id)
      .filter((id): id is number => typeof id === 'number')
    const cardTitles = targets.map((card) => card.title).filter(Boolean)
    if (cardIds.length > 0) {
      this.recordCardTrashAnimation({ cardIds, cardTitles })
    }
  }

  /**
   * 山札から指定したカードIDのカードを引き、手札へ加える。
   * 手札がいっぱいの場合は既存の addCardToPlayerHand の挙動に従う（捨て札送りなど）。
   * 手札に加わった場合は deck-draw 演出用のイベントを積む。
   */
  drawSpecificCard(cardId: number): Card | undefined {
    if (!Number.isInteger(cardId)) {
      return undefined
    }
    const card = this.deckValue.take(cardId)
    if (!card) {
      return undefined
    }
    this.addCardToPlayerHand(card)
    if (card.id !== undefined) {
      this.recordDrawAnimation({ cardIds: [card.id] })
    }
    return card
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
        // プレイヤーターン開始時に敵の次アクションを確定させ、ヒント生成に依存しないようにする
        this.enemyTeam.ensureActionsForTurn(this, this.turnPosition.turn)
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
      case 'play-relic': {
        const relicId = actionLog.resolveValue(entry.relic, this)
        const operations =
          entry.operations?.map((operation) => ({
            type: operation.type,
            payload:
              operation.payload === undefined
                ? undefined
                : actionLog.resolveValue(operation.payload, this),
          })) ?? []
        this.playRelic(relicId as RelicId, operations)
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
      (card) => this.isMemoryCard(card) && card.action?.name === '溶かす',
    )
    const others = cards.filter(
      (card) => !(this.isMemoryCard(card) && card.action?.name === '溶かす'),
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

  private applyCardRuntime(card: Card): Card {
    const computedCost = card.calculateCost({
      battle: this,
      source: this.playerValue,
      cardTags: card.cardTags ?? [],
    })
    card.setRuntimeCost(computedCost)
    const active = card.action?.isActive({
      battle: this,
      source: this.playerValue,
      cardTags: card.cardTags ?? [],
    })
    card.setRuntimeActive(active)
    // Vue側でプレーンオブジェクトとしてスナップショットを扱う際に失われないよう、列挙可能なプロパティにも保持しておく
    ;(card as any).runtimeCost = computedCost
    ;(card as any).runtimeActive = active
    return card
  }

  private cloneBattleSnapshot(source: BattleSnapshot): BattleSnapshot {
    return {
      ...source,
      player: {
        ...source.player,
        states: source.player.states ? source.player.states.map((state) => ({ ...state })) : undefined,
      },
      enemies: source.enemies.map((enemy) => ({
        ...enemy,
        states: enemy.states.map((state) => ({ ...state })),
        plannedActions: enemy.plannedActions
          ? enemy.plannedActions.map((entry) => ({
              ...entry,
              plan: entry.plan ? { ...entry.plan } : undefined,
            }))
          : undefined,
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
      turnPosition: { ...source.turnPosition },
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
    if (outcome === 'victory' && this.enemyTeamValue.id === ORC_HERO_TEAM_ID) {
      this.recordAchievementOrcHeroDefeated()
    }
    if (outcome === 'gameover') {
      this.recordAchievementDefeat()
    }
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
