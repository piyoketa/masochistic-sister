import { describe, it, expect, vi } from 'vitest'
import { MemoryManager } from '@/domain/entities/players'
import { CardRepository } from '@/domain/repository/CardRepository'
import { Attack, type AttackProps } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import type { Battle } from '@/domain/battle/Battle'
import { State } from '@/domain/entities/State'
import {
  EnemySingleTargetCardTag,
  SingleAttackCardTag,
  StatusTypeCardTag,
} from '@/domain/entities/cardTags'

class TestAttack extends Attack {
  constructor(overrides?: Partial<AttackProps>) {
    super({
      name: '記憶攻撃',
      cardDefinition: {
        title: '記憶攻撃',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
      baseDamage: new Damages({ baseAmount: 5, baseCount: 1, type: 'single' }),
      ...(overrides ?? {}),
    })
  }

  override description(): string {
    return '記憶攻撃の説明'
  }
}

describe('MemoryManager', () => {
  it('敵攻撃をカードとして記憶し、手札に追加する', () => {
    const manager = new MemoryManager()
    const repository = new CardRepository()
    const battle = {
      addCardToPlayerHand: vi.fn(),
    } as unknown as Battle

    const attack = new TestAttack()
    const damages = new Damages({ baseAmount: 12, baseCount: 2, type: 'multi' })

    const card = manager.rememberEnemyAttack({
      damages,
      baseAttack: attack,
      repository,
      battle,
    })

    expect(card.id).toBeDefined()
    expect(card.action?.baseDamages.amount).toBe(damages.amount)
    expect(card.action?.baseDamages.count).toBe(damages.count)
    expect(card.cardTags?.some((tag) => tag.id === 'tag-memory')).toBe(true)
    expect(battle.addCardToPlayerHand).toHaveBeenCalledWith(card)
  })

  it('状態をカード化して手札に追加する', () => {
    const manager = new MemoryManager()
    const repository = new CardRepository()
    const battle = {
      addCardToPlayerHand: vi.fn(),
    } as unknown as Battle

    const state = new State({
      id: 'state-memory',
      name: '記憶状態',
      cardDefinition: {
        title: '記憶状態',
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 0,
      },
    })

    const card = manager.rememberState({ state, repository, battle })

    expect(card.id).toBeDefined()
    expect(card.state).toBe(state)
    expect(battle.addCardToPlayerHand).toHaveBeenCalledWith(card)
  })
})
