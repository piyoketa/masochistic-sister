import { describe, it, expect, vi } from 'vitest'

import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { Enemy } from '@/domain/entities/Enemy'
import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { HeavyweightState } from '@/domain/entities/states'

describe('敵攻撃の記憶生成', () => {
  it('攻撃回数0なら記憶カードが手札に追加されない', () => {
    const player = new ProtagonistPlayer()
    const hand = new Hand()
    player.bindHand(hand)
    const attack = new FlurryAction()
    const enemy = new Enemy({
      name: '重量触手',
      maxHp: 20,
      currentHp: 20,
      actions: [attack],
      states: [new HeavyweightState(5)],
      image: 'enemy.png',
    })
    const enemyTeam = new EnemyTeam({ id: 'team-1', members: [enemy] })
    const battle = new Battle({
      id: 'battle-remember-zero',
      player,
      enemyTeam,
      deck: new Deck(),
      hand,
    })
    const addCardSpy = vi.spyOn(battle, 'addCardToPlayerHand')

    const context = attack.prepareContext({
      battle,
      source: enemy,
      operations: [],
    })
    attack.execute(context)

    expect(addCardSpy).not.toHaveBeenCalled()
    expect(battle.hand.list().length).toBe(0)
  })
})