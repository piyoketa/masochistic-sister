import { describe, it, expect } from 'vitest'

import { FlurryAction } from '@/domain/entities/actions/FlurryAction'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import {
  StrengthState,
  AccelerationState,
  CorrosionState,
  HardShellState,
  StickyState,
  BarrierState,
  FlightState,
  HeavyweightState,
  LightweightState,
} from '@/domain/entities/states'
import { Enemy } from '@/domain/entities/Enemy'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'
import type { State } from '@/domain/entities/State'
import { Hand } from '@/domain/battle/Hand'
import { Card } from '@/domain/entities/Card'
import { Battle } from '@/domain/battle/Battle'
import { CardRepository } from '@/domain/repository/CardRepository'
import { Damages } from '@/domain/entities/Damages'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { Deck } from '@/domain/battle/Deck'
import type { Attack } from '@/domain/entities/Action'

function createPlayerWithHand() {
  const player = new ProtagonistPlayer()
  const hand = new Hand()
  player.bindHand(hand)
  const repository = new CardRepository()
  const battle = {
    hand,
    cardRepository: repository,
    addCardToPlayerHand: (card: Card) => hand.add(card),
    recordStateCardAnimation: () => {},
    recordMemoryCardAnimation: () => {},
  } as unknown as Battle

  return {
    player,
    addState: (state: State) => {
      player.addState(state, { battle })
      return state
    },
  }
}

function createEnemyWithStates(states: State[] = []): Enemy {
  return new Enemy({
    name: 'dummy',
    maxHp: 10,
    currentHp: 10,
    actions: [new SkipTurnAction('dummyは様子を見ている')],
    image: '',
    states,
  })
}

function createTentacleFlurryAction() {
  return new FlurryAction().cloneWithDamages(
    new Damages({ baseAmount: 10, baseCount: 3, type: 'multi' }),
  )
}

class InspectableFlurryAction extends FlurryAction {
  capturedDamages?: Damages

  constructor() {
    super()
    const override = new Damages({ baseAmount: 10, baseCount: 3, type: 'multi' })
    const clone = this.cloneWithDamages(override) as this
    Object.assign(this, clone)
  }

  protected override onAfterDamage(
    context: Parameters<FlurryAction['onAfterDamage']>[0],
    damages: Damages,
    defender: Parameters<FlurryAction['onAfterDamage']>[2],
  ): void {
    this.capturedDamages = damages
    super.onAfterDamage(context, damages, defender)
  }
}

class InspectableTackleAction extends TackleAction {
  capturedDamages?: Damages

  protected override onAfterDamage(
    context: Parameters<TackleAction['onAfterDamage']>[0],
    damages: Damages,
    defender: Parameters<TackleAction['onAfterDamage']>[2],
  ): void {
    this.capturedDamages = damages
    super.onAfterDamage(context, damages, defender)
  }
}

function createBattleWithEnemy(enemy: Enemy) {
  const player = new ProtagonistPlayer()
  const deck = new Deck()
  const enemyTeam = new EnemyTeam({ id: 'test-team', members: [enemy] })
  const battle = new Battle({
    id: 'battle-test',
    player,
    enemyTeam,
    deck,
  })

  const registeredEnemy = enemyTeam.members[0]
  if (!registeredEnemy) {
    throw new Error('登録された敵が取得できませんでした')
  }

  return {
    battle,
    player,
    enemy: registeredEnemy,
  }
}

function executePlayerAttack(params: {
  battle: Battle
  player: ProtagonistPlayer
  enemy: Enemy
  attack: Attack
}) {
  const { battle, player, enemy, attack } = params
  const enemyId = enemy.id
  if (enemyId === undefined) {
    throw new Error('Enemy id is required for targeting')
  }
  const context = attack.prepareContext({
    battle,
    source: player,
    operations: [{ type: 'target-enemy', payload: enemyId }],
  })
  attack.execute(context)
}

describe('Attack#calcDamagesの挙動', () => {
  it('筋力や状態が無い場合は10ダメージ×3回になる', () => {
    const action = createTentacleFlurryAction()
    const attacker = createPlayerWithHand().player
    const defender = createEnemyWithStates()

    const damages = action.calcDamages(attacker, defender)

    expect(damages.amount).toBe(10)
    expect(damages.count).toBe(3)
    expect(damages.type).toBe('multi')
    expect(damages.attackerStates).toHaveLength(0)
    expect(damages.defenderStates).toHaveLength(0)
  })

  it('攻撃側に打点上昇(10)があるとダメージが20に増える', () => {
    const action = createTentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    const defender = createEnemyWithStates()
    const strength = attackerHelper.addState(new StrengthState(10))

    const damages = action.calcDamages(attackerHelper.player, defender)

    expect(damages.amount).toBe(20)
    expect(damages.count).toBe(3)
    expect(
      damages.attackerStates.some(
        (state) => state instanceof StrengthState && (state.magnitude ?? 0) === 10,
      ),
    ).toBe(true)
  })

  it('攻撃側の打点上昇と防御側の腐食が重なるとダメージが30になる', () => {
    const action = createTentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    const defenderEnemy = createEnemyWithStates()
    const strength = attackerHelper.addState(new StrengthState(10))
    const corrosion = new CorrosionState(1)
    defenderEnemy.addState(corrosion)

    const damages = action.calcDamages(attackerHelper.player, defenderEnemy)

    expect(damages.amount).toBe(30)
    expect(damages.count).toBe(3)
    expect(
      damages.attackerStates.some(
        (state) => state instanceof StrengthState && (state.magnitude ?? 0) === 10,
      ),
    ).toBe(true)
    expect(damages.defenderStates).toContain(corrosion)
  })

  it('打点上昇と加速、腐食が揃うとダメージ30の4回攻撃になる', () => {
    const action = createTentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    const defenderEnemy = createEnemyWithStates()
    const strength = attackerHelper.addState(new StrengthState(10))
    const acceleration = attackerHelper.addState(new AccelerationState(1))
    const corrosion = new CorrosionState(1)
    defenderEnemy.addState(corrosion)

    const damages = action.calcDamages(attackerHelper.player, defenderEnemy)

    expect(damages.amount).toBe(30)
    expect(damages.count).toBe(4)
    expect(
      damages.attackerStates.some(
        (state) => state instanceof StrengthState && (state.magnitude ?? 0) === 10,
      ),
    ).toBe(true)
    expect(
      damages.attackerStates.some(
        (state) => state instanceof AccelerationState && (state.magnitude ?? 0) === 1,
      ),
    ).toBe(true)
    expect(damages.defenderStates).toContain(corrosion)
  })

  it('防御(20)があるとダメージが10に減少する', () => {
    const action = createTentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    const defenderEnemy = createEnemyWithStates()
    attackerHelper.addState(new StrengthState(10))
    attackerHelper.addState(new AccelerationState(1))
    const corrosion = new CorrosionState(1)
    const hardShell = new HardShellState(20)
    defenderEnemy.addState(corrosion)
    defenderEnemy.addState(hardShell)

    const damages = action.calcDamages(attackerHelper.player, defenderEnemy)

    expect(damages.amount).toBe(10)
    expect(damages.count).toBe(4)
    expect(damages.defenderStates).toContain(corrosion)
    expect(damages.defenderStates).toContain(hardShell)
  })

  it('防御側に加速があってもダメージ計算へは影響しない', () => {
    const action = createTentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    const defenderEnemy = createEnemyWithStates()
    const strength = attackerHelper.addState(new StrengthState(10))
    const acceleration = attackerHelper.addState(new AccelerationState(1))
    const corrosion = new CorrosionState(1)
    const hardShell = new HardShellState(20)
    const defenderAcceleration = new AccelerationState(2)
    defenderEnemy.addState(corrosion)
    defenderEnemy.addState(hardShell)
    defenderEnemy.addState(defenderAcceleration)

    const damages = action.calcDamages(attackerHelper.player, defenderEnemy)

    expect(damages.amount).toBe(10)
    expect(damages.count).toBe(4)
    expect(damages.defenderStates).toContain(corrosion)
    expect(damages.defenderStates).toContain(hardShell)
    expect(damages.defenderStates).not.toContain(defenderAcceleration)
  })

  it('単体攻撃は鈍化による回数増加を受けない', () => {
    const action = new TackleAction()
    const attacker = createPlayerWithHand().player
    const sticky = new StickyState(1)
    const defenderEnemy = createEnemyWithStates([sticky])

    const damages = action.calcDamages(attacker, defenderEnemy)

    expect(damages.amount).toBe(20)
    expect(damages.count).toBe(1)
    expect(damages.defenderStates).not.toContain(sticky)
  })

  it('重量化(1)でダメージが15、回数が2になる', () => {
    const action = createTentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    attackerHelper.addState(new HeavyweightState(1))
    const defender = createEnemyWithStates()

    const damages = action.calcDamages(attackerHelper.player, defender)

    expect(damages.amount).toBe(15)
    expect(damages.count).toBe(2)
  })

  it('軽量化(1)でダメージが6、回数が4になる', () => {
    const action = createTentacleFlurryAction()
    const attackerHelper = createPlayerWithHand()
    attackerHelper.addState(new LightweightState(1))
    const defender = createEnemyWithStates()

    const damages = action.calcDamages(attackerHelper.player, defender)

    expect(damages.amount).toBe(6)
    expect(damages.count).toBe(4)
  })

  it('飛行状態の敵にはダメージが1に制限される', () => {
    const action = createTentacleFlurryAction()
    const attacker = createPlayerWithHand().player
    const defenderEnemy = createEnemyWithStates([new FlightState(1)])

    const damages = action.calcDamages(attacker, defenderEnemy)

    expect(damages.amount).toBe(1)
    expect(damages.count).toBe(3)
  })
})

describe('Attack.performのダメージアウトカム', () => {
  it('バリアが連撃の最初の2ヒットをガードする', () => {
    const enemy = new Enemy({
      name: '防御テスト',
      maxHp: 40,
      currentHp: 40,
      actions: [new SkipTurnAction('何もしない')],
      states: [new BarrierState(2)],
      image: '',
    })
    const { battle, player, enemy: registeredEnemy } = createBattleWithEnemy(enemy)
    const attack = new InspectableFlurryAction()

    executePlayerAttack({ battle, player, enemy: registeredEnemy, attack })

    expect(registeredEnemy.currentHp).toBe(30)
    const damages = attack.capturedDamages
    expect(damages).toBeDefined()
    expect(damages?.outcomes).toEqual([
      { damage: 0, effectType: 'guarded' },
      { damage: 0, effectType: 'guarded' },
      { damage: 10, effectType: 'slash' },
    ])
    expect(damages?.postHitDefenderStateEffects.length).toBeGreaterThanOrEqual(1)
    const barrier = registeredEnemy.states.find((state) => state instanceof BarrierState)
    expect(barrier).toBeUndefined()
  })

  it('HPを削り切った場合は余剰ヒットを省略する', () => {
    const enemy = new Enemy({
      name: '削り切り',
      maxHp: 25,
      currentHp: 25,
      actions: [new SkipTurnAction('何もしない')],
      image: '',
    })
    const { battle, player, enemy: registeredEnemy } = createBattleWithEnemy(enemy)
    const attack = new InspectableFlurryAction()

    executePlayerAttack({ battle, player, enemy: registeredEnemy, attack })

    expect(registeredEnemy.currentHp).toBe(0)
    const damages = attack.capturedDamages
    expect(damages?.outcomes).toEqual([
      { damage: 10, effectType: 'slash' },
      { damage: 10, effectType: 'slash' },
      { damage: 5, effectType: 'slash' },
    ])
    expect(damages?.totalPostHitDamage).toBe(25)
  })

  it('飛行状態の敵にはヒット毎に1ダメージだけ与えられる', () => {
    const enemy = new Enemy({
      name: '飛行テスト',
      maxHp: 10,
      currentHp: 10,
      actions: [new SkipTurnAction('何もしない')],
      states: [new FlightState(1)],
      image: '',
    })
    const { battle, player, enemy: registeredEnemy } = createBattleWithEnemy(enemy)
    const attack = new InspectableTackleAction()

    executePlayerAttack({ battle, player, enemy: registeredEnemy, attack })

    expect(registeredEnemy.currentHp).toBe(9)
    const damages = attack.capturedDamages
    expect(damages?.outcomes).toEqual([{ damage: 1, effectType: 'slam' }])
    expect(damages?.totalPostHitDamage).toBe(1)
  })
})
