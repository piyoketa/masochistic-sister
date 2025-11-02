
import { Card } from '../entities/Card'
import type { CardOperation } from '../entities/operations'
import type { Player } from '../entities/Player'
import type { Enemy } from '../entities/Enemy'
import type { EnemyTeam } from '../entities/EnemyTeam'
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
  }
  enemies: Array<{
    numericId: number
    name: string
    currentHp: number
    maxHp: number
    traits: State[]
    states: State[]
    hasActedThisTurn: boolean
  }>
  deck: Card[]
  hand: Card[]
  discardPile: Card[]
  exilePile: Card[]
  events: BattleEvent[]
  turn: TurnState
  log: ReturnType<BattleLog['list']>
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
  private logSequence = 0
  private executedActionLogIndex = -1
  private eventSequence = 0

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

  getSnapshot(): BattleSnapshot {
    return {
      id: this.idValue,
      player: {
        id: this.playerValue.id,
        name: this.playerValue.name,
        currentHp: this.playerValue.currentHp,
        maxHp: this.playerValue.maxHp,
        currentMana: this.playerValue.currentMana,
        maxMana: this.playerValue.maxMana,
      },
      enemies: this.enemyTeamValue.members.map<BattleSnapshot['enemies'][number]>((enemy: Enemy) => {
        const numericId = enemy.numericId
        if (numericId === undefined) {
          throw new Error(`Enemy ${enemy.name} has no repository id`)
        }

        return {
          numericId,
          name: enemy.name,
          currentHp: enemy.currentHp,
          maxHp: enemy.maxHp,
          traits: enemy.traits,
          states: enemy.states,
          hasActedThisTurn: enemy.hasActedThisTurn,
        }
      }),
      deck: this.deckValue.list(),
      hand: this.handValue.list(),
      discardPile: this.discardPileValue.list(),
      exilePile: this.exilePileValue.list(),
      events: this.eventsValue.list(),
      turn: this.turnValue.current,
      log: this.logValue.list(),
    }
  }

  initialize(): void {}

  startPlayerTurn(): void {
    this.turn.startPlayerTurn()
    this.enemyTeam.endTurn()
    this.player.resetMana()
  }

  drawForPlayer(count: number): void {
    for (let i = 0; i < count; i += 1) {
      if (this.deck.size() === 0) {
        const reloaded = this.reloadDeckFromDiscard()
        if (!reloaded) {
          break
        }
      }

      const card = this.deck.drawOne(this.hand)
      if (!card) {
        break
      }
    }
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

  endPlayerTurn(): void {}

  startEnemyTurn(): void {
    this.turn.startEnemyTurn()
    this.enemyTeam.startTurn()
  }

  performEnemyAction(enemyId: number): void {
    const enemy = this.enemyTeam.findEnemy(enemyId)
    if (!enemy) {
      throw new Error(`Enemy ${enemyId} not found`)
    }

    enemy.act(this)
  }

  resolveEvents(): void {
    const currentTurn = this.turnValue.current.turnCount
    const readyEvents = this.eventsValue.extractReady(currentTurn)

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

  damagePlayer(amount: number): void {
    this.player.takeDamage(amount)
  }

  addCardToPlayerHand(card: Card): void {
    this.hand.add(card)
  }

  executeActionLog(actionLog: ActionLog, targetIndex?: number): void {
    const lastIndex = targetIndex ?? actionLog.length - 1
    if (lastIndex < this.executedActionLogIndex) {
      throw new Error('指定されたActionLogのインデックスは現在の進行度より小さいため、巻き戻しには新しいBattleインスタンスを使用してください。')
    }

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
        break
      case 'draw':
        this.drawForPlayer(entry.count)
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
      case 'end-player-turn':
        this.endPlayerTurn()
        break
      case 'start-enemy-turn':
        this.startEnemyTurn()
        break
      case 'enemy-action': {
        const enemyId = actionLog.resolveValue(entry.enemy, this)
        this.performEnemyAction(enemyId)
        break
      }
      default:
        throw new Error(`未対応のActionLogエントリ type=${(entry as { type: string }).type}`)
    }
  }

  private applyEvent(event: BattleEvent): void {
    if (event.type === 'mana') {
      const rawAmount = (event.payload as { amount?: unknown }).amount
      const amount = typeof rawAmount === 'number' ? rawAmount : Number(rawAmount ?? 0)
      if (Number.isFinite(amount) && amount !== 0) {
        this.player.gainTemporaryMana(amount)
      }
    }
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
}
