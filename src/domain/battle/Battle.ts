import type { Card, CardOperation } from '../entities/Card'
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
import { TurnManager, type TurnState } from './TurnManager'
import { CardRepository } from '../repository/CardRepository'

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
    id: string
    name: string
    currentHp: number
    maxHp: number
    traits: State[]
    states: State[]
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
      enemies: this.enemyTeamValue.members.map<BattleSnapshot['enemies'][number]>((enemy: Enemy) => ({
        id: enemy.id,
        name: enemy.name,
        currentHp: enemy.currentHp,
        maxHp: enemy.maxHp,
        traits: enemy.traits,
        states: enemy.states,
      })),
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
    this.player.resetMana()
  }

  drawForPlayer(count: number): void {
    this.deck.draw(count, this.hand)
  }

  playCard(cardId: string, operation?: CardOperation): void {}

  endPlayerTurn(): void {}

  startEnemyTurn(): void {}

  performEnemyAction(enemyId: string): void {}

  resolveEvents(): void {}

  enqueueEvent(event: BattleEvent): void {}

  addLogEntry(entry: Parameters<BattleLog['record']>[0]): void {}
}
