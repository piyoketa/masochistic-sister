import { describe, it, expect } from 'vitest'

import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { Card } from '@/domain/entities/Card'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { CorrosionState } from '@/domain/entities/states/CorrosionState'
import { StickyState } from '@/domain/entities/states/StickyState'
import { CardRepository } from '@/domain/repository/CardRepository'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { TestEnemyTeam } from '@/domain/entities/enemyTeams'

function createBattleWith(
  handCards: Card[],
  options: { discardPile?: DiscardPile } = {},
): {
  battle: Battle
  repository: CardRepository
  discard: DiscardPile
} {
  const repository = new CardRepository()
  handCards.forEach((card) => {
    if (!card.hasId()) {
      repository.register(card)
    }
  })

  const discard = options.discardPile ?? new DiscardPile()

  const battle = new Battle({
    id: 'battle-hand-limit-test',
    player: new ProtagonistPlayer(),
    enemyTeam: new TestEnemyTeam(),
    deck: new Deck(),
    hand: new Hand(handCards),
    discardPile: discard,
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
    cardRepository: repository,
  })

  return { battle, repository, discard }
}

function createMemoryStateCard(repository: CardRepository, title: string): Card {
  return repository.create(() =>
    new Card({
      state: title === '腐食' ? new CorrosionState(1) : new StickyState(1),
      definitionOverrides: { title },
    }),
  )
}

describe('Hand limit mechanics', () => {
  describe('Battle.addCardToPlayerHand', () => {
    it('手札10枚で最も古いカードが状態なら、最古の非状態カードが捨て札に移動する', () => {
      const sourceRepository = new CardRepository()

      const statusOldest = sourceRepository.create(() =>
        new Card({
          state: new CorrosionState(1),
          definitionOverrides: { title: '腐食' },
        }),
      )
      const oldestNonStatus = sourceRepository.create(() =>
        new Card({ action: new BattlePrepAction(), definitionOverrides: { title: '準備0' } }),
      )
      const otherCards = Array.from({ length: 8 }, (_, index) =>
        sourceRepository.create(() =>
          new Card({
            action: new BattlePrepAction(),
            definitionOverrides: { title: `準備${index + 1}` },
          }),
        ),
      )

      const { battle, discard, repository } = createBattleWith([statusOldest, oldestNonStatus, ...otherCards])

      const newCard = repository.create(() =>
        new Card({ action: new BattlePrepAction(), definitionOverrides: { title: '新カード' } }),
      )

      battle.addCardToPlayerHand(newCard)

      const handTitles = battle.hand.list().map((card) => card.title)
      expect(handTitles).toContain('新カード')
      expect(handTitles).not.toContain(oldestNonStatus.title)
      expect(discard.list().map((card) => card.title)).toContain(oldestNonStatus.title)
      expect(battle.hand.list()).toHaveLength(10)
    })

    it('手札10枚すべてが状態なら新しいカードは捨て札へ移動する', () => {
      const sourceRepository = new CardRepository()
      const statusCards = Array.from({ length: 10 }, (_, index) =>
        sourceRepository.create(() =>
          new Card({
            state: index % 2 === 0 ? new CorrosionState(1) : new StickyState(1),
            definitionOverrides: { title: `状態${index}` },
          }),
        ),
      )

      const { battle, discard, repository } = createBattleWith(statusCards)

      const incoming = repository.create(() =>
        new Card({ action: new BattlePrepAction(), definitionOverrides: { title: '追加カード' } }),
      )

      battle.addCardToPlayerHand(incoming)

      expect(battle.hand.list()).toHaveLength(10)
      expect(battle.hand.list().map((card) => card.title)).not.toContain('追加カード')
      expect(discard.list().map((card) => card.title)).toContain('追加カード')
    })
  })

  describe('Hand.removeOldest', () => {
    it('条件に合致した最古のカードを返し、手札から取り除く', () => {
      const repository = new CardRepository()
      const cards = [
        createMemoryStateCard(repository, '腐食'),
        repository.create(() => new Card({ action: new BattlePrepAction(), definitionOverrides: { title: '準備A' } })),
        repository.create(() => new Card({ action: new BattlePrepAction(), definitionOverrides: { title: '準備B' } })),
      ]

      const hand = new Hand(cards)

      const removed = hand.removeOldest((card) => card.definition.cardType !== 'status')

      expect(removed?.title).toBe('準備A')
      expect(hand.list().map((card) => card.title)).toEqual(['腐食', '準備B'])
    })

    it('条件に合致するカードがなければ undefined を返し手札は変化しない', () => {
      const repository = new CardRepository()
      const cards = [
        createMemoryStateCard(repository, '腐食'),
        createMemoryStateCard(repository, '鈍化'),
      ]
      const hand = new Hand(cards)

      const removed = hand.removeOldest((card) => card.definition.cardType !== 'status')

      expect(removed).toBeUndefined()
      expect(hand.list().map((card) => card.title)).toEqual(['腐食', '鈍化'])
    })
  })

  describe('Hand.addMany', () => {
    it('手札が9枚のとき2枚追加すると最初の1枚だけが手札に加わる', () => {
      const repository = new CardRepository()
      const existing = Array.from({ length: 9 }, (_, index) =>
        repository.create(() => new Card({
          action: new BattlePrepAction(),
          definitionOverrides: { title: `既存${index}` },
        })),
      )

      const hand = new Hand(existing)
      const first = repository.create(() =>
        new Card({ action: new BattlePrepAction(), definitionOverrides: { title: '追加1' } }),
      )
      const second = repository.create(() =>
        new Card({ action: new BattlePrepAction(), definitionOverrides: { title: '追加2' } }),
      )

      hand.addMany([first, second])

      const titles = hand.list().map((card) => card.title)
      expect(titles).toHaveLength(10)
      expect(titles).toContain('追加1')
      expect(titles).not.toContain('追加2')
    })
  })

  describe('Deck.drawOne', () => {
    it('手札に空きがある場合はドローしたカードが手札に移動する', () => {
      const repository = new CardRepository()
      const hand = new Hand([])
      const topCard = repository.create(() =>
        new Card({ action: new BattlePrepAction(), definitionOverrides: { title: 'トップ' } }),
      )
      const deck = new Deck([topCard])

      const drawn = deck.drawOne(hand)

      expect(drawn?.title).toBe('トップ')
      expect(hand.list().map((card) => card.title)).toEqual(['トップ'])
      expect(deck.list()).toHaveLength(0)
    })

    it('手札が上限に達している場合はカードを山札に戻す', () => {
      const repository = new CardRepository()
      const fullHandCards = Array.from({ length: 10 }, (_, index) =>
        repository.create(() =>
          new Card({
            action: new BattlePrepAction(),
            definitionOverrides: { title: `手札${index}` },
          }),
        ),
      )
      const hand = new Hand(fullHandCards)

      const topCard = repository.create(() =>
        new Card({ action: new BattlePrepAction(), definitionOverrides: { title: '戻るカード' } }),
      )
      const deck = new Deck([topCard])

      const drawn = deck.drawOne(hand)

      expect(drawn).toBeUndefined()
      expect(hand.list().map((card) => card.title)).not.toContain('戻るカード')
      expect(deck.list().map((card) => card.title)).toEqual(['戻るカード'])
    })
  })
})
