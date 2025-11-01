import { Card } from '../entities/Card'
import { Attack } from '../entities/Action'
import { Damages } from '../entities/Damages'
import type { Battle } from '../battle/Battle'
import type { Deck } from '../battle/Deck'
import type { Hand } from '../battle/Hand'
import type { DiscardPile } from '../battle/DiscardPile'
import type { ExilePile } from '../battle/ExilePile'
import type { State } from '../entities/State'

export type CardFactory<T extends Card = Card> = () => T

export type CardLocation = 'deck' | 'hand' | 'discardPile' | 'exilePile' | 'unknown'

interface CardRepositoryZones {
  deck: Deck
  hand: Hand
  discardPile: DiscardPile
  exilePile: ExilePile
}

export class CardRepository {
  private readonly cards = new Map<number, Card>()
  private counter = 0
  private zones?: CardRepositoryZones

  create<T extends Card>(factory: CardFactory<T>): T {
    const id = this.generateId()
    const card = factory()
    card.assignRepositoryId(id)

    this.cards.set(id, card)
    return card
  }

  register(card: Card): void {
    const id = card.numericId ?? this.generateId()

    if (!Number.isInteger(id) || id < 0) {
      throw new Error(`Card id must be a non-negative integer, received: ${id}`)
    }

    if (this.cards.has(id)) {
      throw new Error(`Card with id ${id} already registered`)
    }

    card.assignRepositoryId(id)
    this.cards.set(id, card)
  }

  findById<T extends Card = Card>(id: number): T | undefined {
    return this.cards.get(id) as T | undefined
  }

  find<T extends Card = Card>(predicate: (card: Card) => boolean): T | undefined {
    for (const card of this.cards.values()) {
      if (predicate(card)) {
        return card as T
      }
    }

    return undefined
  }

  list(): Card[] {
    return Array.from(this.cards.values())
  }

  bindZones(zones: CardRepositoryZones): void {
    this.zones = zones
  }

  findWithLocation<T extends Card = Card>(id: number): { card: T; location: CardLocation } | undefined {
    const card = this.findById<T>(id)
    if (!card) {
      return undefined
    }

    const zones = this.zones
    if (!zones) {
      return { card, location: 'unknown' }
    }

    if (zones.hand.find(id)) {
      return { card, location: 'hand' }
    }

    if (zones.deck.list().some((candidate) => candidate.numericId === id)) {
      return { card, location: 'deck' }
    }

    if (zones.discardPile.list().some((candidate) => candidate.numericId === id)) {
      return { card, location: 'discardPile' }
    }

    if (zones.exilePile.list().some((candidate) => candidate.numericId === id)) {
      return { card, location: 'exilePile' }
    }

    return { card, location: 'unknown' }
  }

  remove(id: number): void {
    this.cards.delete(id)
  }

  clear(): void {
    this.cards.clear()
    this.counter = 0
  }

  private buildMemoryOverrides(baseAttack: Attack, damages: Damages) {
    const baseDefinition = baseAttack.createCardDefinition()
    const title = `記憶：${baseAttack.name}`
    const description = damages.count <= 1
      ? `${damages.amount}ダメージ`
      : `${damages.amount}ダメージ × ${damages.count}`
    const fullDescription = baseDefinition.description
      ? `${description}
${baseDefinition.description}`
      : description

    return {
      name: baseAttack.name,
      description: fullDescription,
      cardDefinition: {
        ...baseDefinition,
        title,
        description: fullDescription,
      },
    }
  }

  createNewAttack(damages: Damages, baseAttack: Attack): Card {
    const overrides = this.buildMemoryOverrides(baseAttack, damages)
    const action = baseAttack.cloneWithDamages(damages, overrides)
    return this.create(() => new Card({ action }))
  }

  memoryEnemyAttack(damages: Damages, baseAttack: Attack): Card
  memoryEnemyAttack(damages: Damages, baseAttack: Attack, battle: Battle): Card
  memoryEnemyAttack(damages: Damages, baseAttack: Attack, battle?: Battle): Card {
    const card = this.createNewAttack(damages, baseAttack)
    if (battle) {
      // プレイヤーが被弾した時のみ発火する想定。バトル側に渡して手札へ追加する。
      battle.addCardToPlayerHand(card)
    }
    return card
  }

  createStateCard(state: State): Card {
    return this.create(() => new Card({ state }))
  }

  memoryState(state: State, battle: Battle): Card {
    const card = this.createStateCard(state)
    battle.addCardToPlayerHand(card)
    return card
  }

  private generateId(): number {
    const id = this.counter
    this.counter += 1
    return id
  }
}
