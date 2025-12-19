import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Enemy } from '@/domain/entities/Enemy'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { AllyCleanseAction } from '@/domain/entities/actions/AllyCleanseAction'
import { CorrosionState } from '@/domain/entities/states/CorrosionState'
import { JointDamageState } from '@/domain/entities/states/JointDamageState'
import { StickyState } from '@/domain/entities/states/StickyState'
import type { State } from '@/domain/entities/State'
import type { Battle } from '@/domain/battle/Battle'

function createEnemy(name: string, states: State[] = [], rngValue = 0): Enemy {
  return new Enemy({
    name,
    maxHp: 30,
    currentHp: 30,
    actions: [],
    states,
    image: '/dummy.png',
    rng: () => rngValue,
  })
}

describe('治療スキル', () => {
  let healer: Enemy
  let target: Enemy
  let enemyTeam: EnemyTeam
  let battle: Battle

  beforeEach(() => {
    healer = createEnemy('ヒーラー', [])
    target = createEnemy('ターゲット', [], 0)
    enemyTeam = new EnemyTeam({ id: 'team-1', members: [healer, target] })
    battle = {
      enemyTeam,
      turnPosition: { turn: 1, side: 'player' },
      addLogEntry: vi.fn(),
      notifyActionResolved: vi.fn(),
    } as unknown as Battle
  })

  it('状態異常持ちがいない場合はcanUseがfalseになる', () => {
    const action = new AllyCleanseAction()
    expect(action.canUse({ battle, source: healer })).toBe(false)
  })

  it('対象候補がいる場合はplanTargetに成功し、状態異常を1種類除去する', () => {
    target.addState(new CorrosionState(10))
    target.addState(new StickyState(1))
    const action = new AllyCleanseAction()
    const planned = action.planTarget({ battle, source: healer, team: enemyTeam })
    expect(planned).toBe(true)

    const context = {
      battle,
      source: healer,
      metadata: {},
    } as any
    action.execute(context)

    const remainingIds = target.getStates().map((state) => state.id)
    expect(remainingIds.includes('state-corrosion')).toBe(false)
    expect(remainingIds.includes('state-sticky')).toBe(true)
    expect(context.metadata?.removedStateId).toBeDefined()
  })

  it('実行時に対象が対象ステートを失っていればスキップする', () => {
    target.addState(new JointDamageState(20))
    const action = new AllyCleanseAction()
    const planned = action.planTarget({ battle, source: healer, team: enemyTeam })
    expect(planned).toBe(true)

    target.removeState('state-joint-damage')
    const context = {
      battle,
      source: healer,
      metadata: {},
    } as any
    action.execute(context)

    expect(context.metadata?.skipReason).toBe('ally-cleanse-no-state')
  })
})
