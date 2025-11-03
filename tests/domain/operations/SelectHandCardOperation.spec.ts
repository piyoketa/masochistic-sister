import { describe, it, expect } from 'vitest'
import { SelectHandCardOperation, type OperationContext } from '@/domain/entities/operations'
import { Player } from '@/domain/entities/Player'
import { Card } from '@/domain/entities/Card'
import { Skill } from '@/domain/entities/Action'
import type { CardDefinition } from '@/domain/entities/CardDefinition'

class DummySkill extends Skill {
  constructor() {
    super({
      name: '手札カード',
      cardDefinition: {
        title: '手札カード',
        type: 'skill',
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

function createContext(card?: Card): OperationContext {
  const player = createPlayer()
  return {
    player,
    battle: {
      player,
      hand: {
        find: (cardId: number) => {
          if (!card) {
            return undefined
          }
          return card.numericId === cardId ? card : undefined
        },
      },
    } as unknown as OperationContext['battle'],
  }
}

describe('SelectHandCardOperation', () => {
  it('手札内のカードを解決しメタデータを返す', () => {
    const card = new Card({ action: new DummySkill() })
    card.assignRepositoryId(12)
    const operation = new SelectHandCardOperation()
    const context = createContext(card)

    operation.complete(12, context)

    expect(operation.card).toBe(card)
    expect(operation.toMetadata()).toEqual({ selectedHandCardId: 12 })
  })

  it('手札に存在しないカード ID は例外になる', () => {
    const card = new Card({ action: new DummySkill() })
    card.assignRepositoryId(1)
    const operation = new SelectHandCardOperation()
    const context = createContext(card)

    expect(() => operation.complete(999, context)).toThrowError('Card 999 not found in hand')
  })

  it('不正な入力フォーマットを検出する', () => {
    const card = new Card({ action: new DummySkill() })
    card.assignRepositoryId(7)
    const operation = new SelectHandCardOperation()
    const context = createContext(card)

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
        },
      } as unknown as OperationContext['battle'],
    }

    operation.complete(0, context)

    expect(() => operation.toMetadata()).toThrowError('Selected hand card missing repository id')
  })
})
