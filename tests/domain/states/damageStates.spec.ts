import { describe, it, expect } from 'vitest'

import { Damages } from '@/domain/entities/Damages'
import {
  HeavyweightState,
  LightweightState,
  FlightState,
  PoisonState,
  CorrosionState,
  FuryAwakeningState,
  StrengthState,
  StickyState,
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
      cardId: 'test-card',
      attackerStates: [new HeavyweightState()],
    })

    expect(damages.amount).toBe(15)
    expect(damages.count).toBe(2)
  })

  it('複数スタックで倍率と回数減少が累積する', () => {
    const damages = new Damages({
      baseAmount: 8,
      baseCount: 4,
      type: 'multi',
      cardId: 'test-card',
      attackerStates: [new HeavyweightState(3)],
    })

    expect(damages.amount).toBe(20)
    expect(damages.count).toBe(1)
  })
  
  it('スタックによって連撃回数が0まで減少する', () => {
    const damages = new Damages({
      baseAmount: 10,
      baseCount: 2,
      type: 'multi',
      cardId: 'test-card',
      attackerStates: [new HeavyweightState(5)],
    })

    expect(damages.amount).toBe(35)
    expect(damages.count).toBe(0)
  })
})

describe('軽量化Stateの挙動', () => {
  it('1スタックでダメージが2/3倍、ヒット数+1になる', () => {
    const damages = new Damages({
      baseAmount: 12,
      baseCount: 2,
      type: 'multi',
      cardId: 'test-card',
      attackerStates: [new LightweightState()],
    })

    expect(damages.amount).toBe(8)
    expect(damages.count).toBe(3)
  })

  it('複数スタックで倍率と回数増加が累積する', () => {
    const damages = new Damages({
      baseAmount: 10,
      baseCount: 2,
      type: 'multi',
      cardId: 'test-card',
      attackerStates: [new LightweightState(3)],
    })

    expect(damages.amount).toBe(4)
    expect(damages.count).toBe(5)
  })

  it('打点上昇(10)と軽量化(1)が重なると(5+10)*2/3で10ダメージになる', () => {
    // 優先度10の打点上昇で加算した後、優先度15の軽量化で倍率を掛ける順番になっているかを検証する。
    const damages = new Damages({
      baseAmount: 5,
      baseCount: 1,
      type: 'single',
      cardId: 'test-card',
      attackerStates: [new LightweightState(1), new StrengthState(10)],
    })

    expect(damages.amount).toBe(10)
    expect(damages.count).toBe(1)
    expect(
      damages.attackerStates.some(
        (state) => state instanceof StrengthState && (state.magnitude ?? 0) === 10,
      ),
    ).toBe(true)
    expect(
      damages.attackerStates.some(
        (state) => state instanceof LightweightState && (state.magnitude ?? 0) === 1,
      ),
    ).toBe(true)
  })

  it('重量化(攻撃側)と粘液(防御側)で回数補正が相殺される', () => {
    const damages = new Damages({
      baseAmount: 10,
      baseCount: 2,
      type: 'multi',
      cardId: 'test-card',
      attackerStates: [new HeavyweightState()],
      defenderStates: [new StickyState(1)],
    })

    expect(damages.amount).toBe(15) // 重量化の+50%のみ適用
    expect(damages.count).toBe(2) // 攻撃側-1と防御側+1で元の2回へ戻る
  })

  it('防御側の軽量化は攻撃回数を増やさない（単発攻撃は1回のまま）', () => {
    const damages = new Damages({
      baseAmount: 5,
      baseCount: 1,
      type: 'single',
      cardId: 'shape-up',
      defenderStates: [new LightweightState()],
    })

    expect(damages.count).toBe(1)
  })
})

describe('ダメージ固定Stateの挙動', () => {
  it('受けるダメージが常に1へ制限される', () => {
    const damages = new Damages({
      baseAmount: 20,
      baseCount: 2,
      type: 'multi',
      cardId: 'test-card',
      defenderStates: [new FlightState()],
    })

    expect(damages.amount).toBe(1)
    expect(damages.count).toBe(2)
  })
})

describe('ダメージ固定と腐食の優先度', () => {
  it('ダメージ固定が常に最後に適用されて1ダメージへ制限する', () => {
    const damages = new Damages({
      baseAmount: 30,
      baseCount: 2,
      type: 'multi',
      cardId: 'test-card',
      defenderStates: [new CorrosionState(1), new FlightState()],
    })

    expect(damages.amount).toBe(1)
    expect(damages.count).toBe(2)
  })

  it('付与順序が逆でも同じ結果になる', () => {
    const damages = new Damages({
      baseAmount: 25,
      baseCount: 1,
      type: 'single',
      cardId: 'test-card',
      defenderStates: [new FlightState(), new CorrosionState(2)],
    })

    expect(damages.amount).toBe(1)
    expect(damages.count).toBe(1)
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

describe('怒りの覚醒Stateの挙動', () => {
  it('3ヒット受けると打点上昇(15)を得る', () => {
    const enemy = new Enemy({
      name: '怒りの兵士',
      maxHp: 40,
      currentHp: 40,
      actions: [new SkipTurnAction('待機')],
      states: [new FuryAwakeningState()],
      image: 'fury.png',
    })
    const fury = enemy.states.find((state) => state.id === 'state-fury-awakening') as FuryAwakeningState
    if (!fury) {
      throw new Error('怒りの覚醒ステートが設定されていません')
    }
    const attacker = new ProtagonistPlayer()
    const battle = {} as Battle
    const attack = new SkipTurnAction('dummy')

    const createContext = () => ({
      battle,
      attack,
      attacker,
      defender: enemy,
      damages: new Damages({ baseAmount: 10, baseCount: 1, type: 'single', cardId: 'test-card' }),
      index: 0,
      outcome: { damage: 10, effectType: 'slash' as const },
      role: 'defender' as const,
    })

    fury.onHitResolved(createContext())
    fury.onHitResolved(createContext())
    fury.onHitResolved(createContext())

    fury.onDamageSequenceResolved({
      battle,
      attack,
      attacker,
      defender: enemy,
      damages: new Damages({ baseAmount: 10, baseCount: 1, type: 'single', cardId: 'test-card' }),
      outcomes: [],
    })

    const strength = enemy.states.find((state) => state.id === 'state-strength') as StrengthState | undefined
    expect(strength?.magnitude).toBe(15)
  })
})
