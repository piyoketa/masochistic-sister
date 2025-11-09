import { describe, it, expect } from 'vitest'
import {
  SelectHandCardOperation,
  type OperationContext,
  type HandCardSelectionAvailabilityEntry,
} from '@/domain/entities/operations'
import { Player } from '@/domain/entities/Player'
import { Card } from '@/domain/entities/Card'
import { Skill } from '@/domain/entities/Action'
import type { CardDefinition } from '@/domain/entities/CardDefinition'
import { SelfTargetCardTag, SkillTypeCardTag } from '@/domain/entities/cardTags'

class DummySkill extends Skill {
  constructor() {
    super({
      name: '手札カード',
      cardDefinition: {
        title: '手札カード',
        cardType: 'skill',
        type: new SkillTypeCardTag(),
        target: new SelfTargetCardTag(),
        cost: 0,
      } satisfies CardDefinition,
    })
  }
}

function createPlayer(): Player {
  return new Player({
    id: 'player',
    name: 'テストプレイヤー',
    maxHp: 20,
    currentHp: 20,
    maxMana: 3,
    currentMana: 3,
  })
}

function createContext(cards: Card[], player = createPlayer()): OperationContext {
  return {
    player,
    battle: {
      player,
      hand: {
        find: (cardId: number) => cards.find((candidate) => candidate.id === cardId),
        list: () => [...cards],
      },
    } as unknown as OperationContext['battle'],
  }
}

describe('SelectHandCardOperation', () => {
  it('手札内のカードを解決しメタデータを返す', () => {
    const card = new Card({ action: new DummySkill() })
    card.assignId(12)
    const other = new Card({ action: new DummySkill() })
    other.assignId(99)
    const operation = new SelectHandCardOperation()
    const context = createContext([card, other])

    operation.complete(12, context)

    expect(operation.card).toBe(card)
    expect(operation.toMetadata()).toEqual({ selectedHandCardId: 12 })
  })

  it('手札に存在しないカード ID は例外になる', () => {
    const card = new Card({ action: new DummySkill() })
    card.assignId(1)
    const operation = new SelectHandCardOperation()
    const context = createContext([card])

    expect(() => operation.complete(999, context)).toThrowError('Card 999 not found in hand')
  })

  it('不正な入力フォーマットを検出する', () => {
    const card = new Card({ action: new DummySkill() })
    card.assignId(7)
    const operation = new SelectHandCardOperation()
    const context = createContext([card])

    expect(() => operation.complete('invalid', context)).toThrowError(
      'Operation requires a numeric hand card id',
    )
  })

  it('カードにリポジトリ ID が無い場合はメタデータ生成時に例外になる', () => {
    const card = new Card({ action: new DummySkill() })
    const operation = new SelectHandCardOperation()

    const context: OperationContext = {
      player: createPlayer(),
      battle: {
        player: createPlayer(),
        hand: {
          find: () => card,
          list: () => [card],
        },
      } as unknown as OperationContext['battle'],
    }

    operation.complete(0, context)

    expect(() => operation.toMetadata()).toThrowError('Selected hand card missing repository id')
  })
  it('describeAvailabilityで選択可能なカード一覧を返す', () => {
    const selectable = new Card({ action: new DummySkill() })
    selectable.assignId(1)
    const blocked = new Card({ action: new DummySkill() })
    blocked.assignId(2)
    const operation = new SelectHandCardOperation({
      filter: (card) => card.id === 1,
      filterMessage: '選択不可',
    })
    const context = createContext([selectable, blocked])

    const availability = operation.describeAvailability(context)

    expect(availability).toEqual<HandCardSelectionAvailabilityEntry[]>([
      { cardId: 1, selectable: true },
      { cardId: 2, selectable: false, reason: '選択不可' },
    ])
  })
})
