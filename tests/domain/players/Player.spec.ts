import { describe, it, expect } from 'vitest'
import { Player } from '@/domain/entities/Player'
import { Hand } from '@/domain/battle/Hand'
import { CardRepository } from '@/domain/repository/CardRepository'
import type { Battle } from '@/domain/battle/Battle'
import { State } from '@/domain/entities/State'
import { StatusTypeCardTag } from '@/domain/entities/cardTags'
import { Card } from '@/domain/entities/Card'

class TestPlayer extends Player {
  constructor() {
    super({
      id: 'player-test',
      name: 'テストプレイヤー',
      maxHp: 10,
      currentHp: 10,
      maxMana: 3,
      currentMana: 3,
    })
  }
}

describe('Player.addState スタック処理', () => {
  const createBattleStub = (player: Player) => {
    const hand = new Hand()
    const repository = new CardRepository()
    player.bindHand(hand)
    const battle = {
      hand,
      cardRepository: repository,
      addCardToPlayerHand: (card: Card) => {
        hand.add(card)
      },
    } as unknown as Battle

    return { battle, hand, repository }
  }

  const createState = (id: string, magnitude: number) =>
    new State({
      id,
      name: `state-${id}`,
      magnitude,
      cardDefinition: {
        title: `state-${id}`,
        cardType: 'status',
        type: new StatusTypeCardTag(),
        target: undefined,
        cost: 0,
      },
    })

  it('同一IDの状態を追加するとカードは増えるが合計値は加算される', () => {
    const player = new TestPlayer()
    const { battle, hand } = createBattleStub(player)

    player.addState(createState('stack', 2), { battle })
    expect(hand.list()).toHaveLength(1)
    expect(hand.list()[0]!.state?.magnitude).toBe(2)

    player.addState(createState('stack', 3), { battle })
    expect(hand.list()).toHaveLength(2)
  })

  it('異なるIDの状態は別カードとして追加される', () => {
    const player = new TestPlayer()
    const { battle, hand } = createBattleStub(player)

    player.addState(createState('accel', 1), { battle })
    player.addState(createState('armor', 4), { battle })

    expect(hand.list()).toHaveLength(2)
    const ids = hand.list().map((card) => card.state?.id)
    expect(ids).toContain('accel')
    expect(ids).toContain('armor')
  })

  it('getStatesは同一IDの状態を一つにまとめて返す', () => {
    const player = new TestPlayer()
    const { battle } = createBattleStub(player)

    player.addState(createState('stack', 2), { battle })
    player.addState(createState('stack', 3), { battle })

    const aggregated = player
      .getStates()
      .filter((state) => state.id === 'stack')

    expect(aggregated).toHaveLength(1)
    expect(aggregated[0]?.magnitude).toBe(5)
  })
})
