import { describe, it, expect } from 'vitest'
import { MiasmaAction } from '@/domain/entities/actions/MiasmaAction'
import { Player } from '@/domain/entities/Player'
import { CardRepository } from '@/domain/repository/CardRepository'
import { Hand } from '@/domain/battle/Hand'
import type { Battle } from '@/domain/battle/Battle'

function createPlayer(): Player {
  return new Player({
    id: 'player-1',
    name: 'テストプレイヤー',
    maxHp: 30,
    currentHp: 30,
    maxMana: 3,
    currentMana: 3,
  })
}

function createBattleStub(player: Player): Battle {
  const repository = new CardRepository()
  const hand = new Hand()
  ;(player as unknown as { handRef?: Hand }).handRef = hand
  return {
    player,
    cardRepository: repository,
    enemyTeam: { handleActionResolved: () => {} },
    notifyActionResolved: () => {},
    addCardToPlayerHand: (card) => {
      hand.add(card)
    },
    recordStateCardAnimation: () => {},
  } as unknown as Battle
}

describe('MiasmaAction の gainStates 動作', () => {
  it('自分に瘴気状態を付与する', () => {
    const player = createPlayer()
    const battle = createBattleStub(player)
    const action = new MiasmaAction()

    const context = action.prepareContext({
      battle,
      source: player,
      operations: [],
    })

    expect(player.getStates()).toHaveLength(0)

    action.execute(context)

    const states = player.getStates()
    expect(states.some((state) => state.id === 'state-miasma')).toBe(true)
  })
})
