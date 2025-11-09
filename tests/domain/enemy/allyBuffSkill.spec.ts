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
import { TailwindAction } from '@/domain/entities/actions/TailwindAction'
import { BattlePrepAction } from '@/domain/entities/actions/BattlePrepAction'
import { DailyRoutineAction } from '@/domain/entities/actions/DailyRoutineAction'
import { AccelerationState } from '@/domain/entities/states/AccelerationState'

function createBattleWithEnemies(enemies: Enemy[]): Battle {
  const team = new EnemyTeam({
    id: 'ally-buff-test',
    members: enemies,
  })

  return new Battle({
    id: 'battle-ally-buff',
    player: new ProtagonistPlayer(),
    enemyTeam: team,
    deck: new Deck(),
    hand: new Hand(),
    discardPile: new DiscardPile(),
    exilePile: new ExilePile(),
    events: new BattleEventQueue(),
    log: new BattleLog(),
    turn: new TurnManager(),
  })
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
    battle.enemyTeam.planUpcomingActions(battle)
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

    battle.enemyTeam.planUpcomingActions(battle)

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
    battle.enemyTeam.planUpcomingActions(battle)
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
    battle.enemyTeam.planUpcomingActions(battle)

    expect(tailwind.getPlannedTarget()).toBe(lancer.id)

    lancer.setStatus('defeated')
    kamaitachi.act(battle)

    const metadata = kamaitachi.consumeLastActionMetadata()
    expect(metadata?.skipped).toBe(true)
    expect(metadata?.skipReason).toBe('ally-target-missing')
    expect(lancer.states.some((state) => state instanceof AccelerationState)).toBe(false)
  })
})
