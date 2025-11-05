import { describe, it, expect } from 'vitest'

import { Damages } from '@/domain/entities/Damages'
import {
  HeavyweightState,
  LightweightState,
  FlightState,
  PoisonState,
} from '@/domain/entities/states'
import { Enemy } from '@/domain/entities/Enemy'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import type { Battle } from '@/domain/battle/Battle'

describe('重量化Stateの挙動', () => {
  it('1スタックでダメージが1.5倍になりヒット数が1減る', () => {
    const damages = new Damages({
      baseAmount: 10,
      baseCount: 3,
      type: 'multi',
      attackerStates: [new HeavyweightState(1)],
    })

    expect(damages.amount).toBe(15)
    expect(damages.count).toBe(2)
  })
})

describe('軽量化Stateの挙動', () => {
  it('1スタックでダメージが2/3倍、ヒット数+1になる', () => {
    const damages = new Damages({
      baseAmount: 12,
      baseCount: 2,
      type: 'multi',
      attackerStates: [new LightweightState(1)],
    })

    expect(damages.amount).toBe(8)
    expect(damages.count).toBe(3)
  })
})

describe('飛行Stateの挙動', () => {
  it('受けるダメージが常に1へ制限される', () => {
    const damages = new Damages({
      baseAmount: 20,
      baseCount: 2,
      type: 'multi',
      defenderStates: [new FlightState(1)],
    })

    expect(damages.amount).toBe(1)
    expect(damages.count).toBe(2)
  })
})

describe('毒Stateの挙動', () => {
  it('敵ユニットにターン開始時ダメージを与える', () => {
    const enemy = new Enemy({
      name: '毒対象',
      maxHp: 30,
      currentHp: 30,
      actions: [new SkipTurnAction('待機')],
      image: '',
    })
    const poison = new PoisonState(3)
    const battle = {
      damageEnemy: (target: Enemy, amount: number) => target.takeDamage(amount),
      damagePlayer: () => {},
    } as unknown as Battle

    poison.onTurnStart({ battle, owner: enemy })

    expect(enemy.currentHp).toBe(27)
  })

  it('プレイヤーにもターン開始時ダメージを与える', () => {
    const player = new ProtagonistPlayer({ currentHp: 50, maxHp: 50 })
    const poison = new PoisonState(4)
    const battle = {
      damageEnemy: () => {},
      damagePlayer: (amount: number) => player.takeDamage(amount),
    } as unknown as Battle

    poison.onTurnStart({ battle, owner: player })

    expect(player.currentHp).toBe(46)
  })
})
