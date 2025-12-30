import type {
  Battle,
  BattleSnapshot,
  FullBattleSnapshot,
  PlayCardAnimationContext,
  EnemyTurnActionSummary,
  DamageEvent,
  StateCardAnimationEvent,
  MemoryCardAnimationEvent,
} from './Battle'
import type {
  AnimationInstruction,
  AnimationStageMetadata,
  AnimationBatch,
  BattleActionLogEntry,
  EnemyActEntryMetadata,
  BattleSnapshotPatch,
} from './ActionLog'
import { ActionLog } from './ActionLog'
import type { Card } from '../entities/Card'
import type { Action, ActionAudioCue, ActionCutInCue } from '../entities/Action'
import type { DamageOutcome } from '../entities/Damages'
import type { RelicId } from '../entities/relics/relicTypes'
import { isPredictionDisabled } from '../utils/predictionToggle'

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
  createBattle?: () => Battle
}

interface AppendOptions {
  suppressFlush?: boolean
}

interface DrainedAnimationEvents {
  drawEvents: Array<{ cardIds: number[]; drawnCount?: number; handOverflow?: boolean }>
  discardDrawEvents: Array<{ cardIds: number[]; handOverflow?: boolean }>
  manaEvents: Array<{ amount: number }>
  damageEvents: DamageEvent[]
  defeatEvents: number[]
  cardTrashEvents: Array<{ cardIds: number[]; variant?: 'trash' | 'eliminate' }>
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

type PlayActionOperations = Extract<
  BattleActionLogEntry,
  { type: 'play-card' | 'play-relic' }
>['operations']

interface EnemyActionAudioConfig {
  soundId: string
  waitMs?: number
  durationMs?: number
}

const ENEMY_ACTION_AUDIO_MAP = new Map<string, EnemyActionAudioConfig>([
  ['戦いの舞い', { soundId: 'skills/kurage-kosho_status03.mp3', waitMs: 500, durationMs: 500 }],
  ['ビルドアップ', { soundId: 'skills/kurage-kosho_status03.mp3', waitMs: 500, durationMs: 500 }],
  ['足止め', { soundId: 'skills/OtoLogic_Electric-Shock02-Short.mp3', waitMs: 500, durationMs: 500 }],
])

export class OperationRunner {
  private static readonly CARD_CREATE_ANIMATION_DURATION_MS = 1500
  private static readonly CARD_TRASH_ANIMATION_DURATION_MS = 600
  private static readonly CARD_ELIMINATE_ANIMATION_DURATION_MS = 720
  private static readonly STATE_CARD_ANIMATION_DURATION_MS = 500
  private static readonly MEMORY_CARD_ANIMATION_DURATION_MS = 1500

  private readonly battle: Battle
  private readonly actionLog: ActionLog
  private readonly onEntryAppended?: (entry: BattleActionLogEntry, context: EntryAppendContext) => void
  private readonly initialSnapshot: FullBattleSnapshot
  private readonly createBattle?: () => Battle

  private initialized = false
  private recordedOutcome?: Battle['status']
  private enemyActGroupCounter = 0
  private pendingEnemyActSummaries: EnemyTurnActionSummary[] = []
  private instructionBatchCounter = 0

  constructor(config: OperationRunnerConfig) {
    this.battle = config.battle
    this.actionLog = config.actionLog ?? new ActionLog()
    this.onEntryAppended = config.onEntryAppended
    this.createBattle = config.createBattle
    if (config.initialSnapshot) {
      this.initialSnapshot = this.cloneFullSnapshot(config.initialSnapshot)
      this.battle.restoreFullSnapshot(this.initialSnapshot)
    } else {
      this.initialSnapshot = this.battle.captureFullSnapshot()
    }
    // Battle からの予測計算依頼に応じるためのデリゲートをセットする
    this.battle.setPredictionDelegate(() => this.simulateEndTurnPrediction())
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

  playRelic(relicId: string | number, operations?: PlayActionOperations): number {
    this.initializeIfNeeded()
    return this.appendEntry({
      type: 'play-relic',
      relic: relicId,
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
    let index = -1 // ActionLog 上の挿入位置を初期化
    const needsBeforeSnapshot = entry.type === 'play-card' || entry.type === 'play-relic' // play-card / play-relic の場合のみ前スナップショットが必要
    const snapshotBefore = needsBeforeSnapshot ? this.battle.captureFullSnapshot() : undefined // 前スナップショットを取得
    try {
      index = this.actionLog.push(entry) // ActionLog にエントリを追記してインデックスを得る
      this.battle.executeActionLog(this.actionLog, index) // 追記したエントリを Battle に適用して状態を進める
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error) // 例外メッセージを整形
      throw new OperationRunnableError(message, { actionEntry: entry, cause: error }) // 実行文脈付き例外で上位に通知
    }

    const appendedEntry = this.actionLog.at(index) // 直近に追加されたエントリを再取得
    const snapshotAfter = this.battle.captureFullSnapshot() // 適用後のフルスナップショットを取得
    const entrySnapshotOverride = this.battle.consumeEntrySnapshotOverride() // Battle 側が指示したスナップショット差し替えを取得

    const drainedEvents = this.drainAnimationEvents() // Battle が蓄えた演出イベントを回収

    if (appendedEntry) { // エントリが存在する場合のみ後続処理
      if (appendedEntry.type === 'enemy-act') { // 敵行動エントリ専用の処理
        const summary = this.pendingEnemyActSummaries.shift() // 事前に蓄えた行動サマリを取得
        const summarySnapshot = summary?.snapshotAfter ?? entrySnapshotOverride ?? snapshotAfter.snapshot // スナップショットの決定順を定義
        const clonedSnapshot = this.cloneBattleSnapshot(summarySnapshot) // UI に渡す用にディープコピー
        appendedEntry.postEntrySnapshot = clonedSnapshot // エントリに結果スナップショットを紐付け
        this.attachEnemyActAnimations(appendedEntry, clonedSnapshot, drainedEvents, summary) // 敵行動用のアニメーション指示を付与
      } else { // それ以外のエントリ共通処理
        const baseSnapshot = entrySnapshotOverride ?? snapshotAfter.snapshot // スナップショット基準を決定
        const clonedSnapshot = this.cloneBattleSnapshot(baseSnapshot) // UI 用にコピー
        appendedEntry.postEntrySnapshot = clonedSnapshot // 結果スナップショットを付与
        if (appendedEntry.type === 'play-card' && snapshotBefore) { // カードプレイ時のみ前後比較付き演出を付ける
          this.attachPlayCardAnimations(appendedEntry, snapshotBefore.snapshot, clonedSnapshot, drainedEvents) // カード演出を付与
        } else { // シンプルなエントリは単純演出を付与
          this.attachSimpleEntryAnimation(appendedEntry, clonedSnapshot, drainedEvents) // 基本的な演出を付与
        }
      }
    }

    this.emitEntryAppended(entry, index) // ActionLog 追記を外部へ通知（ViewManager などが受信）

    this.appendImmediateEnemyActEntries() // 連鎖して追加すべき敵行動エントリを即時差し込む

    if (!options?.suppressFlush) { // flush を抑制しない場合
      this.flushResolvedEvents() // 確定した演出イベントを ActionLog に反映
      this.flushStateEvents() // 状態カード等の演出イベントを反映
      this.appendBattleOutcomeIfNeeded() // 勝敗が決まっていればエントリを追加
    }

    return index // 最終的な ActionLog インデックスを返す
  }

  private drainAnimationEvents(): DrainedAnimationEvents {
    return {
      drawEvents: this.battle.consumeDrawAnimationEvents(),
      discardDrawEvents: this.battle.consumeDiscardDrawAnimationEvents(),
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
      case 'enemy-act': {
        const skipReason = (entry.metadata as any)?.skipReason as string | undefined
        const isDefeatedOrEscaped = skipReason === 'defeated' || skipReason === 'escaped'
        return {
          waitMs: isDefeatedOrEscaped ? 0 : 500,
          groupId: `enemy-act:${entry.enemyId}:${this.enemyActGroupCounter++}`,
        }
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
    const {
      snapshotAfter,
      cardsAddedToPlayerHand,
      animation,
      metadata,
      stateCardEvents,
      memoryCardEvents,
      ...rest
    } = action
    return {
      ...rest,
      cardsAddedToPlayerHand: cardsAddedToPlayerHand.map((card) => ({ ...card })),
      stateCardEvents: stateCardEvents ? this.cloneStateCardAnimationEvents(stateCardEvents) : undefined,
      memoryCardEvents: memoryCardEvents ? this.cloneMemoryCardAnimationEvents(memoryCardEvents) : undefined,
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
    entry.animationBatches = this.buildPlayCardAnimations(before, after, context, drainedEvents)
  }

  private buildPlayCardAnimations(
    before: BattleSnapshot,
    after: BattleSnapshot,
    context: PlayCardAnimationContext | undefined,
    drainedEvents: DrainedAnimationEvents,
  ): AnimationBatch[] {
    const cardId = context?.cardId
    const cardTitle = this.findCardTitle(before, cardId)
    const actionInstructions: AnimationInstruction[] = []

    actionInstructions.push(...this.buildManaInstructions(drainedEvents.manaEvents))
    const cardMovementInstructions = this.buildCardMovementInstructionsFromEvents(
      drainedEvents.cardTrashEvents,
      after,
    )
    if (cardMovementInstructions.length > 0) {
      actionInstructions.push(...cardMovementInstructions)
    } else {
      const fallbackCardMovementInstruction = this.buildCardMovementInstructionFromSnapshot(
        after,
        cardId,
        cardTitle,
        context?.cardTags,
      )
      if (fallbackCardMovementInstruction) {
        actionInstructions.push(fallbackCardMovementInstruction)
      }
    }

    const drawInstruction = this.buildAggregatedDeckDrawInstruction(drainedEvents.drawEvents)
    if (drawInstruction) {
      actionInstructions.push(drawInstruction)
    }
    const discardDrawInstruction = this.buildAggregatedDiscardDrawInstruction(
      drainedEvents.discardDrawEvents,
    )
    if (discardDrawInstruction) {
      actionInstructions.push(discardDrawInstruction)
    }

    if (context?.audio) {
      actionInstructions.push(this.buildAudioInstruction(context.audio))
    }
    if (context?.cutin) {
      actionInstructions.push(this.buildCutInInstruction(context.cutin))
    }

    const damageInstruction = this.buildEnemyDamageInstruction(drainedEvents.damageEvents, cardId, cardTitle)
    if (damageInstruction) {
      actionInstructions.push(damageInstruction)
    }

    actionInstructions.push(...this.buildStateCardInstructions(drainedEvents.stateCardEvents))
    actionInstructions.push(...this.buildMemoryCardInstructions(drainedEvents.memoryCardEvents))

    const batches: AnimationBatch[] = []
    if (actionInstructions.length > 0) {
      batches.push(
        this.createBatch(this.cloneBattleSnapshot(after), actionInstructions, this.nextBatchId('player-action')),
      )
    }

    const defeatBatches = this.buildDefeatBatches(drainedEvents.defeatEvents, after, { cardId, cardTitle })
    const primaryDefeatBatch = defeatBatches[0]
    if (primaryDefeatBatch) {
      primaryDefeatBatch.batchId = this.nextBatchId('enemy-defeat')
      batches.push(primaryDefeatBatch)
    }

    return batches
  }

  private buildManaInstructions(events: Array<{ amount: number }> = []): AnimationInstruction[] {
    return events
      .filter((event) => event.amount !== 0)
      .map((event) => ({
        waitMs: 0,
        metadata: {
          stage: 'mana',
          amount: event.amount,
        },
      }))
  }

  private buildCardMovementInstructionsFromEvents(
    events: Array<{ cardIds: number[]; cardTitles?: string[]; variant?: 'trash' | 'eliminate' }> = [],
    snapshot: BattleSnapshot,
  ): AnimationInstruction[] {
    if (!events.length) {
      return []
    }
    return events.map((event) => ({
      waitMs:
        event.variant === 'eliminate'
          ? 0
          : OperationRunner.CARD_TRASH_ANIMATION_DURATION_MS,
      metadata: {
        stage: event.variant === 'eliminate' ? 'card-eliminate' : 'card-trash',
        cardIds: event.cardIds,
        cardTitles:
          event.cardTitles && event.cardTitles.length === event.cardIds.length
            ? [...event.cardTitles]
            : event.cardIds
                .map((id) => this.findCardTitle(snapshot, id))
                .filter((title): title is string => Boolean(title)),
      },
    }))
  }

  private buildCardMovementInstructionFromSnapshot(
    after: BattleSnapshot,
    cardId: number | undefined,
    cardTitle: string | undefined,
    cardTags: string[] | undefined,
  ): AnimationInstruction | undefined {
    if (cardId === undefined) {
      return undefined
    }
    const destination = this.determineCardDestination(after, cardId)
    const resolvedStage =
      destination === 'discard'
        ? 'card-trash'
        : destination === 'exile'
        ? 'card-eliminate'
        : cardTags?.includes('tag-exhaust')
        ? 'card-eliminate'
        : 'card-trash'
    return {
      waitMs:
        resolvedStage === 'card-eliminate'
          ? OperationRunner.CARD_ELIMINATE_ANIMATION_DURATION_MS
          : OperationRunner.CARD_TRASH_ANIMATION_DURATION_MS,
      metadata: {
        stage: resolvedStage,
        cardIds: [cardId],
        cardTitles: cardTitle ? [cardTitle] : undefined,
      },
    }
  }

  private buildAudioInstruction(audio: ActionAudioCue): AnimationInstruction {
    if (!audio.soundId) {
      throw new Error('audio instruction requires soundId')
    }
    const waitMs = Math.max(0, audio.waitMs ?? 500)
    return {
      waitMs,
      metadata: {
        stage: 'audio',
        soundId: audio.soundId,
        durationMs: audio.durationMs ?? audio.waitMs ?? 500,
      },
    }
  }

  private buildCutInInstruction(cutin: ActionCutInCue): AnimationInstruction {
    if (!cutin.src) {
      throw new Error('cutin instruction requires src')
    }
    const waitMs = Math.max(0, cutin.waitMs ?? 800)
    return {
      waitMs,
      metadata: {
        stage: 'cutin',
        src: cutin.src,
        durationMs: cutin.durationMs ?? cutin.waitMs ?? 800,
      },
    }
  }

  private buildEnemyDamageInstruction(
    events: DamageEvent[] = [],
    cardId: number | undefined,
    cardTitle: string | undefined,
  ): AnimationInstruction | undefined {
    if (!events.length) {
      return undefined
    }
    const damageStage = this.resolveDamageStage(events, 'enemy-damage')
    return {
      waitMs: this.calculateDamageWaitFromEvents(events),
      metadata: {
        stage: damageStage,
        cardId,
        cardTitle,
        enemyId: damageStage === 'enemy-damage' ? this.extractDamageTargetId(events) : undefined,
        damageOutcomes: this.extractDamageOutcomesFromEvents(events),
      },
    }
  }

  private buildStateCardInstructions(events: StateCardAnimationEvent[] = []): AnimationInstruction[] {
    if (!events.length) {
      return []
    }
    return events.map((event) => ({
      waitMs: OperationRunner.STATE_CARD_ANIMATION_DURATION_MS,
      metadata: {
        stage: 'create-state-card',
        durationMs: OperationRunner.STATE_CARD_ANIMATION_DURATION_MS,
        stateId: event.stateId,
        stateName: event.stateName,
        cardId: event.cardId,
        cardIds: event.cardId !== undefined ? [event.cardId] : event.cardIds,
        cardTitle: event.cardTitle ?? event.stateName,
        cardTitles:
          event.cardTitles ??
          (event.cardTitle ? [event.cardTitle] : event.stateName ? [event.stateName] : undefined),
        cardCount: event.cardCount ?? (event.cardId !== undefined ? 1 : undefined),
        enemyId: event.enemyId,
      },
    }))
  }

  private buildMemoryCardInstructions(events: MemoryCardAnimationEvent[] = []): AnimationInstruction[] {
    if (!events.length) {
      return []
    }
    return events.map((event) => ({
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
    }))
  }

  private buildEnemyActionInstructions(
    entry: Extract<BattleActionLogEntry, { type: 'enemy-act' }>,
    summary: EnemyTurnActionSummary | undefined,
    drainedEvents: DrainedAnimationEvents,
    memoryEvents: MemoryCardAnimationEvent[],
  ): AnimationInstruction[] {
    if (summary?.skipped) {
      const skipInstruction = this.buildSkippedEnemyActInstruction(summary, entry)
      return skipInstruction ? [skipInstruction] : []
    }

    const instructions: AnimationInstruction[] = []
    const damageEvents = summary?.animation?.damageEvents ?? []
    if (damageEvents.length > 0) {
      const damageStage = this.resolveDamageStage(damageEvents, 'player-damage')
      instructions.push({
        waitMs: this.calculateEnemyDamageWait(damageEvents),
        metadata: {
          stage: damageStage,
          enemyId: entry.enemyId,
          actionName: entry.actionName,
          damageOutcomes: this.extractDamageOutcomesFromEvents(damageEvents),
        },
      })
    }

    const stateEvents = summary?.stateCardEvents ?? drainedEvents.stateCardEvents
    instructions.push(...this.buildStateCardInstructions(stateEvents))

    const rememberedEvents = summary?.memoryCardEvents ?? memoryEvents
    if (rememberedEvents.length > 0) {
      // ダメージ演出と記憶カード生成を同一バッチにまとめ、演出の分断を防ぐ
      instructions.push(...this.buildMemoryCardInstructions(rememberedEvents))
    }

    const audioConfig = summary ? this.resolveEnemyActionAudioConfig(summary) : undefined
    if (audioConfig) {
      instructions.push(this.buildAudioInstruction(audioConfig))
    }

    return instructions
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

  private calculateDamageWaitFromEvents(events: DamageEvent[]): number {
    if (!events.length) {
      return 0
    }
    const firstEvent = events[0]
    if (!firstEvent) {
      return 0
    }
    const hits = firstEvent.outcomes.length
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
      events: source.events.map((event) => ({ ...event, payload: event.payload })),
      turn: { ...source.turn },
      log: [...source.log],
      status: source.status,
    }
  }

  private cloneFullSnapshot(source: FullBattleSnapshot): FullBattleSnapshot {
    // HP予測のシミュレーション再生で元の Action インスタンスを汚染しないため、Action は都度クローンを生成して使い回す。
    // （追い風の planned target がシミュレーション側で clear され、本番キューから消える事象への対策）
    // 非列挙プロパティ（inflictStateFactories など）も含めてコピーするために、PropertyDescriptor ベースで複製する。
    const actionCache = new Map<Action, Action>()
    const cloneAction = (action: Action): Action => {
      const cached = actionCache.get(action)
      if (cached) {
        return cached
      }
      // プロトタイプを維持しつつ、自前フィールドを descriptor ごと shallow copy する。
      const cloned = Object.create(Object.getPrototypeOf(action)) as Action
      Object.defineProperties(cloned, Object.getOwnPropertyDescriptors(action))
      actionCache.set(action, cloned)
      return cloned
    }

    const cloneActionList = (actions: Action[]): Action[] => actions.map((action) => cloneAction(action))

    return {
      snapshot: this.cloneBattleSnapshot(source.snapshot),
      enemyQueues: source.enemyQueues.map((entry) => ({
        enemyId: entry.enemyId,
        queue: {
          queueState: {
            actions: cloneActionList(entry.queue.queueState.actions),
            turnActions: entry.queue.queueState.turnActions.map((turnAction) => ({
              ...turnAction,
              action: cloneAction(turnAction.action),
              plan: turnAction.plan ? { ...turnAction.plan } : undefined,
            })),
            metadata: entry.queue.queueState.metadata
              ? { ...entry.queue.queueState.metadata }
              : undefined,
            seed: entry.queue.queueState.seed,
          },
          actionHistory: entry.queue.actionHistory.map((action) => cloneAction(action)),
        },
      })),
      relicStates: source.relicStates
        ? source.relicStates.map((entry) => ({
            className: entry.className,
            state: entry.state && typeof entry.state === 'object' ? { ...(entry.state as object) } : entry.state,
          }))
        : undefined,
    }
  }

  /**
   * 現在の操作ログを再生し、疑似的に end-player-turn を追加実行した場合のプレイヤーHPを予測する。
   * Battle の状態は汚さない。
   */
  private simulateEndTurnPrediction(): number | undefined {
    if (isPredictionDisabled()) {
      return undefined
    }
    if (!this.createBattle) {
      return undefined
    }
    try {
      const simBattle = this.createBattle()
      // 初期スナップショットを適用してからログを再生する
      simBattle.restoreFullSnapshot(this.cloneFullSnapshot(this.initialSnapshot))
      const simLog = new ActionLog(this.actionLog.toArray())
      simLog.push({ type: 'end-player-turn' })
      simBattle.executeActionLog(simLog, simLog.length - 1)
      const result = simBattle.player.currentHp
      return result
    } catch (error) {
      return undefined
    }
  }

  private findCardById(cards: Card[], cardId: number): Card | undefined {
    return cards.find((card) => card.id === cardId)
  }

  private findRelicName(relicId: string | number): string | undefined {
    const normalized = String(relicId)
    const relic = this.battle.getRelicById(normalized as RelicId)
    return relic?.name
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
        entry.animationBatches = [this.buildStartPlayerTurnBatch(snapshot, drainedEvents)]
        return
      case 'play-relic': {
        const relicId = this.actionLog.resolveValue(entry.relic, this.battle)
        metadata = {
          stage: 'relic-activate',
          relicId: String(relicId),
          relicName: this.findRelicName(relicId),
        }
        waitMs = 200
        break
      }
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
      const shouldSkipSnapshot = metadata.stage === 'turn-end'
      const batchOptions = shouldSkipSnapshot
        ? {
            skipSnapshotUpdate: true,
            omitPatch: true,
          }
        : metadata.stage === 'relic-activate'
        ? {
            omitPatch: true,
          }
        : undefined
      const batch = this.createBatch(
        snapshot,
        [
          {
            waitMs,
            metadata,
          },
        ],
        undefined,
        batchOptions,
      )
      if (metadata.stage === 'relic-activate') {
        // 手札差分ウォッチャが前のスナップショットを参照できるよう、レリック起動バッチはレリック領域だけを更新するパッチに絞る
        batch.patch = this.createRelicOnlySnapshotPatch(snapshot)
      }
      batches.push(batch)
    }

    const damageEvents = drainedEvents.damageEvents
    if (damageEvents.length > 0) {
      const damageStage = this.resolveDamageStage(damageEvents, 'enemy-damage')
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
    batches.push(...this.buildDiscardDrawBatches(drainedEvents.discardDrawEvents, snapshot))
    batches.push(...this.buildManaBatches(drainedEvents.manaEvents, snapshot))
    batches.push(...this.buildDefeatBatches(drainedEvents.defeatEvents, snapshot))
    batches.push(...this.buildCardTrashBatches(drainedEvents.cardTrashEvents, snapshot))
    batches.push(...this.buildStateCardBatches(drainedEvents.stateCardEvents, snapshot))
    batches.push(...this.buildMemoryCardBatches(drainedEvents.memoryCardEvents, snapshot))

    if (batches.length > 0) {
      entry.animationBatches = batches
    }
  }

  private buildStartPlayerTurnBatch(
    snapshot: BattleSnapshot,
    drainedEvents: DrainedAnimationEvents,
  ): AnimationBatch {
    const instructions: AnimationInstruction[] = [
      {
        waitMs: 0,
        metadata: { stage: 'turn-start' },
      },
      {
        waitMs: 0,
        metadata: {
          stage: 'mana',
          amount: snapshot.player.currentMana,
        },
      },
    ]

    const deckDrawInstruction = this.buildAggregatedDeckDrawInstruction(drainedEvents.drawEvents)
    if (deckDrawInstruction) {
      instructions.push(deckDrawInstruction)
    }
    const discardDrawInstruction = this.buildAggregatedDiscardDrawInstruction(
      drainedEvents.discardDrawEvents,
    )
    if (discardDrawInstruction) {
      instructions.push(discardDrawInstruction)
    }

    return this.createBatch(snapshot, instructions, this.nextBatchId('turn-start'))
  }

  private buildAggregatedDeckDrawInstruction(
    drawEvents: Array<{ cardIds: number[]; drawnCount?: number; handOverflow?: boolean }> = [],
  ): AnimationInstruction | undefined {
    if (!drawEvents.length) {
      return undefined
    }
    const aggregatedCardIds = drawEvents.flatMap((event) => event.cardIds ?? [])
    const totalDrawn = drawEvents.reduce(
      (sum, event) => sum + (event.drawnCount ?? (event.cardIds?.length ?? 0)),
      0,
    )
    const handOverflow = drawEvents.some((event) => event.handOverflow)
    if (aggregatedCardIds.length === 0 && !handOverflow) {
      return undefined
    }
    const durationMs = aggregatedCardIds.length > 0 ? this.calculateDeckDrawDuration(aggregatedCardIds.length) : 0
    return {
      waitMs: durationMs,
      metadata: {
        stage: 'deck-draw',
        cardIds: aggregatedCardIds,
        draw: totalDrawn > 0 ? totalDrawn : undefined,
        durationMs: durationMs || undefined,
        ...(handOverflow ? { handOverflow: true } : {}),
      },
    }
  }

  private buildAggregatedDiscardDrawInstruction(
    drawEvents: Array<{ cardIds: number[]; handOverflow?: boolean }> = [],
  ): AnimationInstruction | undefined {
    if (!drawEvents.length) {
      return undefined
    }
    const aggregatedCardIds = drawEvents.flatMap((event) => event.cardIds ?? [])
    const handOverflow = drawEvents.some((event) => event.handOverflow)
    if (aggregatedCardIds.length === 0 && !handOverflow) {
      return undefined
    }
    const durationMs =
      aggregatedCardIds.length > 0 ? this.calculateDeckDrawDuration(aggregatedCardIds.length) : 0
    return {
      waitMs: durationMs,
      metadata: {
        stage: 'discard-draw',
        cardIds: aggregatedCardIds,
        durationMs: durationMs || undefined,
        ...(handOverflow ? { handOverflow: true } : {}),
      },
    }
  }

  private attachEnemyActAnimations(
    entry: Extract<BattleActionLogEntry, { type: 'enemy-act' }>,
    snapshot: BattleSnapshot,
    drainedEvents: DrainedAnimationEvents,
    summary?: EnemyTurnActionSummary,
  ): void {
    const batches: AnimationBatch[] = []
    // create-state-card / memory-card ステージより前にカードが手札へ出現するとView側がアニメーションを割り当てられないため、
    // ハイライト/被ダメージまではカード生成分を一時的に隠したスナップショットを用いる。
    const aggregatedCardAdditionIds = new Set<number>()
    summary?.cardsAddedToPlayerHand.forEach((card) => {
      if (typeof card.id === 'number') {
        aggregatedCardAdditionIds.add(card.id)
      }
    })
    const appendCardIdsFromEvents = (events?: Array<{ cardIds?: number[]; cardId?: number }>) => {
      events?.forEach((event) => {
        if (Array.isArray(event.cardIds)) {
          event.cardIds
            .filter((id): id is number => typeof id === 'number')
            .forEach((id) => aggregatedCardAdditionIds.add(id))
        }
        if (typeof event.cardId === 'number') {
          aggregatedCardAdditionIds.add(event.cardId)
        }
      })
    }
    appendCardIdsFromEvents(summary?.stateCardEvents)
    appendCardIdsFromEvents(summary?.memoryCardEvents)
    const cardAdditionIds = Array.from(aggregatedCardAdditionIds)
    const snapshotBeforeCardAdditions =
      cardAdditionIds.length > 0 ? this.cloneSnapshotWithoutHandCards(snapshot, cardAdditionIds) : undefined

    const baseSnapshot = snapshotBeforeCardAdditions ?? snapshot
    const skipReason = summary?.skipReason
    const shouldHighlight = skipReason !== 'defeated' && skipReason !== 'escaped'
    if (shouldHighlight) {
      const highlightInstructions: AnimationInstruction[] = [
        {
          waitMs: 0,
          metadata: {
            stage: 'enemy-highlight',
            enemyId: entry.enemyId,
            actionName: entry.actionName,
            skipped: summary?.skipped ?? false,
          },
        },
      ]
      batches.push(this.createBatch(baseSnapshot, highlightInstructions, this.nextBatchId('enemy-act-start')))
    }

    const memoryEvents = summary?.memoryCardEvents ?? drainedEvents.memoryCardEvents
    const enemyActionInstructions = this.buildEnemyActionInstructions(entry, summary, drainedEvents, memoryEvents)
    if (enemyActionInstructions.length > 0) {
      batches.push(
        // enemy-action バッチでは生成後の snapshot を適用して手札出現とダメージ演出を同時に扱う
        this.createBatch(snapshot, enemyActionInstructions, this.nextBatchId('enemy-action')),
      )
    }

    entry.animationBatches = batches
  }

  private resolveEnemyActionAudioConfig(summary: EnemyTurnActionSummary): EnemyActionAudioConfig | undefined {
    const metadataAudio =
      summary.metadata && typeof summary.metadata === 'object'
        ? (summary.metadata as { audio?: EnemyActionAudioConfig }).audio
        : undefined
    if (metadataAudio && typeof metadataAudio.soundId === 'string') {
      return metadataAudio
    }
    if (summary.actionName && ENEMY_ACTION_AUDIO_MAP.has(summary.actionName)) {
      return ENEMY_ACTION_AUDIO_MAP.get(summary.actionName)
    }
    return undefined
  }

  private buildSkippedEnemyActInstruction(
    summary: EnemyTurnActionSummary,
    entry: Extract<BattleActionLogEntry, { type: 'enemy-act' }>,
  ): AnimationInstruction | undefined {
    if (summary.skipReason === 'already-acted') {
      return {
        waitMs: 500,
        metadata: {
          stage: 'already-acted-enemy',
          enemyId: entry.enemyId,
        },
      }
    }
    return undefined
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

  private buildDiscardDrawBatches(
    drawEvents: Array<{ cardIds: number[]; handOverflow?: boolean }>,
    snapshot: BattleSnapshot,
  ): AnimationBatch[] {
    if (!drawEvents || drawEvents.length === 0) {
      return []
    }
    return drawEvents
      .filter((event) => (event.cardIds?.length ?? 0) > 0 || event.handOverflow)
      .map((event) => {
        const batchId = this.nextBatchId('discard-draw')
        const durationMs = this.calculateDeckDrawDuration(event.cardIds.length || 1)
        const metadata: AnimationStageMetadata = {
          stage: 'discard-draw',
          cardIds: event.cardIds ?? [],
          durationMs,
          ...(event.handOverflow ? { handOverflow: true } : {}),
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
            waitMs: OperationRunner.CARD_TRASH_ANIMATION_DURATION_MS,
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
        {
          skipSnapshotUpdate: false,
        },
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
    events: DamageEvent[],
    defaultStage: 'enemy-damage' | 'player-damage',
  ): 'enemy-damage' | 'player-damage' {
    // プレイヤー攻撃（enemy-damage）時は defender が enemy なら敵ダメージとして扱う。
    if (defaultStage === 'enemy-damage') {
      return 'enemy-damage'
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
          waitMs: 500,
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
    options?: { skipSnapshotUpdate?: boolean; omitPatch?: boolean },
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
    const clonedSnapshot = this.cloneBattleSnapshot(snapshot)
    return {
      batchId: batchId ?? this.nextBatchId(typeof firstStage === 'string' ? firstStage : 'instruction'),
      snapshot: clonedSnapshot,
      patch: options?.omitPatch ? undefined : this.createSnapshotPatch(clonedSnapshot),
      instructions: normalizedInstructions,
      skipSnapshotUpdate: options?.skipSnapshotUpdate,
    }
  }

  private createRelicOnlySnapshotPatch(snapshot: BattleSnapshot): BattleSnapshotPatch {
    // レリック起動時は手札の差分検出を壊さないよう、プレイヤー（レリック領域）のみを差し替えるパッチを生成する
    const clone = this.cloneBattleSnapshot(snapshot)
    return {
      changes: {
        player: clone.player,
      },
    }
  }

  private createSnapshotPatch(snapshot: BattleSnapshot): BattleSnapshotPatch {
    const clone = this.cloneBattleSnapshot(snapshot)
    return {
      changes: {
        player: clone.player,
        hand: clone.hand,
        deck: clone.deck,
        discardPile: clone.discardPile,
        exilePile: clone.exilePile,
      },
    }
  }

  private extractDamageOutcomesFromEvents(
    events?: readonly DamageEvent[],
  ): readonly DamageOutcome[] | undefined {
    const firstEvent = events?.[0]
    if (!firstEvent) {
      return undefined
    }
    return firstEvent.outcomes.map((outcome) => ({ ...outcome }))
  }

  private extractDamageTargetId(events?: readonly DamageEvent[]): number | undefined {
    if (!events) {
      return undefined
    }
    for (const event of events) {
      if (event.defender.type === 'enemy') {
        return event.defender.enemyId
      }
    }
    return undefined
  }

  private calculateEnemyDamageWait(events: DamageEvent[]): number {
    if (events.length === 0) {
      return 0
    }
    const firstEvent = events[0]
    if (!firstEvent) {
      return 0
    }
    const hits = firstEvent.outcomes.length
    const additional = Math.max(0, hits - 1) * 200
    return 500 + additional
  }

  private calculateDeckDrawDuration(cardCount: number): number {
    if (cardCount <= 0) {
      return 0
    }
    const additionalDelay = Math.max(0, cardCount - 1) * 100
    return 600 + additionalDelay
  }

  private calculateTurnStartDraw(): number {
    // 手札ルールは experimental をデフォルトとし、ターン開始時は常に4枚ドローする
    return 4
  }

  private nextBatchId(stage: string): string {
    return `${stage}:${this.instructionBatchCounter++}`
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
}
