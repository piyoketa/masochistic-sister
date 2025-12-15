import { describe, it, expect, vi } from 'vitest'

import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { ProtagonistPlayer } from '@/domain/entities/players'
import { Enemy } from '@/domain/entities/Enemy'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { DefaultEnemyActionQueue } from '@/domain/entities/enemy/actionQueues'
import { GhostEnemy } from '@/domain/entities/enemies/GhostEnemy'
import { KamaitachiEnemy } from '@/domain/entities/enemies/KamaitachiEnemy'
import { OrcSumoEnemy } from '@/domain/entities/enemies/OrcSumoEnemy'
import { TentacleEnemy } from '@/domain/entities/enemies/TentacleEnemy'
import { TailwindAction } from '@/domain/entities/actions/TailwindAction'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { DailyRoutineAction } from '@/domain/entities/actions/DailyRoutineAction'
import { AccelerationState } from '@/domain/entities/states/AccelerationState'

function createBattleWithTeam(enemyTeam: EnemyTeam): Battle {
  return new Battle({
    id: 'battle-ally-buff',
    player: new ProtagonistPlayer(),
    enemyTeam,
    deck: new Deck(),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
}

function createBattleWithEnemies(enemies: Enemy[]): Battle {
  const team = new EnemyTeam({
    id: 'ally-buff-test',
    members: enemies,
  })

  return createBattleWithTeam(team)
}

const createKamaitachi = (
  actions: [TailwindAction, ...Array<BattlePrepAction | DailyRoutineAction>],
  tailwindWeight = 0,
) =>
  new Enemy({
    name: 'かまいたち',
    maxHp: 20,
    currentHp: 20,
    actions,
    image: 'kamaitachi.png',
    allyTags: ['acceleratable', 'multi-attack'],
    allyBuffWeights: { tailwind: tailwindWeight },
  })

function planNextActions(battle: Battle): void {
  battle.enemyTeam.handlePlayerTurnStart(battle)
  battle.enemyTeam.planUpcomingActions(battle)
}

function createOrcSumoSquadBattleForTailwindTest(): {
  battle: Battle
  kamaitachi: KamaitachiEnemy
  orcSumo: OrcSumoEnemy
  ghost: GhostEnemy
  tentacle: TentacleEnemy
} {
  // OrcSumoSquad想定で重みを100/0に固定し、追い風の抽選結果だけを観察するための編成。
  const kamaitachi = new KamaitachiEnemy({
    allyBuffWeights: { tailwind: 0 },
    actionQueueFactory: () =>
      new DefaultEnemyActionQueue({
        // 初手を必ず追い風にすることで重み付け抽選のみをテストする。
        initialActionPredicate: (action) => action instanceof TailwindAction,
      }),
  })
  const orcSumo = new OrcSumoEnemy({
    allyTags: ['acceleratable', 'multi-attack'],
    allyBuffWeights: { tailwind: 100 },
    actionQueueFactory: () => new DefaultEnemyActionQueue(),
  })
  const ghost = new GhostEnemy({
    allyTags: ['acceleratable', 'multi-attack'],
    allyBuffWeights: { tailwind: 0 },
    actionQueueFactory: () => new DefaultEnemyActionQueue(),
  })
  const tentacle = new TentacleEnemy({
    allyTags: ['acceleratable', 'multi-attack'],
    allyBuffWeights: { tailwind: 0 },
    actionQueueFactory: () => new DefaultEnemyActionQueue(),
  })

  return {
    battle: createBattleWithTeam(
      new EnemyTeam({
        id: 'orc-sumo-squad',
        members: [orcSumo, ghost, kamaitachi, tentacle],
      }),
    ),
    kamaitachi,
    orcSumo,
    ghost,
    tentacle,
  }
}

describe('AllyBuffSkill / TailwindAction', () => {
  it('計画段階で対象が選択される', () => {
    const tailwind = new TailwindAction()
    const kamaitachi = createKamaitachi([tailwind])
    const lancer = new Enemy({
      name: 'オークランサー',
      maxHp: 40,
      currentHp: 40,
      actions: [new BattlePrepAction()],
      image: 'lancer.png',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 50 },
    })
    const snail = new Enemy({
      name: 'かたつむり',
      maxHp: 30,
      currentHp: 30,
      actions: [new BattlePrepAction()],
      image: 'snail.png',
      allyTags: [],
      allyBuffWeights: { tailwind: 0 },
    })

    const battle = createBattleWithEnemies([kamaitachi, lancer, snail])

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
    planNextActions(battle)
    randomSpy.mockRestore()

    expect(tailwind.getPlannedTarget()).toBe(lancer.id)
  })

  it('対象が存在しない場合は追い風が行動キューから取り除かれる', () => {
    const tailwind = new TailwindAction()
    const kamaitachi = createKamaitachi([tailwind, new DailyRoutineAction()])
    const snail = new Enemy({
      name: 'かたつむり',
      maxHp: 30,
      currentHp: 30,
      actions: [new BattlePrepAction()],
      image: 'snail.png',
      allyTags: [],
      allyBuffWeights: {},
    })

    const battle = createBattleWithEnemies([kamaitachi, snail])

    planNextActions(battle)

    const remainingActions = kamaitachi.queuedActions
    expect(remainingActions[0]).not.toBeInstanceOf(TailwindAction)
  })

  it('追い風の実行で加速状態が付与される', () => {
    const tailwind = new TailwindAction()
    const kamaitachi = createKamaitachi([tailwind], 10)
    const lancer = new Enemy({
      name: 'オークランサー',
      maxHp: 40,
      currentHp: 40,
      actions: [new BattlePrepAction()],
      image: 'lancer.png',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 50 },
    })

    const battle = createBattleWithEnemies([kamaitachi, lancer])

    const rngSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
    planNextActions(battle)
    rngSpy.mockRestore()

    expect(tailwind.getPlannedTarget()).toBe(lancer.id)

    kamaitachi.act(battle)

    expect(lancer.states.some((state) => state instanceof AccelerationState)).toBe(true)
  })

  it('計画済みターゲットが不在なら行動は不発になり metadata に skipped が記録される', () => {
    const tailwind = new TailwindAction()
    const kamaitachi = createKamaitachi([tailwind], 10)
    const lancer = new Enemy({
      name: 'オークランサー',
      maxHp: 40,
      currentHp: 40,
      actions: [new BattlePrepAction()],
      image: 'lancer.png',
      allyTags: ['acceleratable', 'multi-attack'],
      allyBuffWeights: { tailwind: 50 },
    })

    const battle = createBattleWithEnemies([kamaitachi, lancer])
    planNextActions(battle)

    expect(tailwind.getPlannedTarget()).toBe(lancer.id)

    lancer.setStatus('defeated')
    kamaitachi.act(battle)

    const metadata = kamaitachi.consumeLastActionMetadata()
    expect(metadata?.skipped).toBe(true)
    expect(metadata?.skipReason).toBe('ally-target-missing')
    expect(lancer.states.some((state) => state instanceof AccelerationState)).toBe(false)
  })

  it('OrcSumoSquad構成では追い風の対象が重み100のオーク力士に固定される', () => {
    const { battle, kamaitachi, orcSumo } = createOrcSumoSquadBattleForTailwindTest()

    planNextActions(battle)

    const plannedTailwind = kamaitachi.queuedActions[0]
    expect(plannedTailwind).toBeInstanceOf(TailwindAction)
    expect((plannedTailwind as TailwindAction).getPlannedTarget()).toBe(orcSumo.id)
  })

  it('OrcSumoSquad構成で100回抽選しても重み0の味方には割り当てられない', () => {
    const { battle, kamaitachi, orcSumo, ghost, tentacle } = createOrcSumoSquadBattleForTailwindTest()

    const iterations = 100
    const counts = { orcSumo: 0, ghost: 0, tentacle: 0, undefined: 0 }

    for (let i = 0; i < iterations; i += 1) {
      planNextActions(battle)
      const plannedTailwind = kamaitachi.queuedActions[0] as TailwindAction
      const target = plannedTailwind.getPlannedTarget()
      if (target === orcSumo.id) {
        counts.orcSumo += 1
        continue
      }
      if (target === ghost.id) {
        counts.ghost += 1
        continue
      }
      if (target === tentacle.id) {
        counts.tentacle += 1
        continue
      }
      counts.undefined += 1
    }

    // 重み0を明示した味方には一度も当たらず、重み100のオーク力士が全件で選ばれることを確認する。
    expect(counts.orcSumo).toBe(iterations)
    expect(counts.ghost).toBe(0)
    expect(counts.tentacle).toBe(0)
    expect(counts.undefined).toBe(0)
  })
})
