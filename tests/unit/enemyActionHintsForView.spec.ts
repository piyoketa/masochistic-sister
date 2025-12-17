import { describe, it, expect } from 'vitest'
import { Battle } from '@/domain/battle/Battle'
import { Deck } from '@/domain/battle/Deck'
import { Hand } from '@/domain/battle/Hand'
import { DiscardPile } from '@/domain/battle/DiscardPile'
import { ExilePile } from '@/domain/battle/ExilePile'
import { BattleEventQueue } from '@/domain/battle/BattleEvent'
import { BattleLog } from '@/domain/battle/BattleLog'
import { TurnManager } from '@/domain/battle/TurnManager'
import { Enemy } from '@/domain/entities/Enemy'
import { EnemyTeam } from '@/domain/entities/EnemyTeam'
import { TackleAction } from '@/domain/entities/actions/TackleAction'
import { SkipTurnAction } from '@/domain/entities/actions/SkipTurnAction'
import { TailwindAction } from '@/domain/entities/actions/TailwindAction'
import { ProtagonistPlayer } from '@/domain/entities/players'
import type { EnemyActionChipViewModel } from '@/types/enemyActionChip'
import { formatEnemyActionChipsForView, type EssentialEnemyActionHint } from '@/view/enemyActionHintsForView'
import { summarizeEnemyAction } from '@/view/enemyActions/actionHintBuilders'

function createEssential(params: {
  key: string
  hint: EssentialEnemyActionHint['hint']
  acted?: boolean
  targetName?: string
}): EssentialEnemyActionHint {
  return {
    key: params.key,
    action: new TackleAction(),
    attackerStates: [],
    defenderStates: [],
    acted: Boolean(params.acted),
    targetName: params.targetName,
    hint: params.hint,
  }
}

function createBattleForHint(): { battle: Battle; enemies: Enemy[] } {
  const enemyA = new Enemy({
    name: 'テスト敵A',
    maxHp: 30,
    currentHp: 30,
    actions: [new TackleAction()],
    image: 'enemy-a.png',
  })
  const enemyB = new Enemy({
    name: 'テスト敵B',
    maxHp: 30,
    currentHp: 30,
    actions: [new TackleAction()],
    image: 'enemy-b.png',
  })
  const team = new EnemyTeam({
    id: 'enemy-team-test',
    members: [enemyA, enemyB],
  })

  const battle = new Battle({
    id: 'battle-test',
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

  return { battle, enemies: team.members }
}

describe('summarizeEnemyAction', () => {
  it('SkipTurnAction は skip ヒントとして返す', () => {
    const { battle, enemies } = createBattleForHint()
    const enemy = enemies[0]!
    const action = new SkipTurnAction('動けない')

    const hint = summarizeEnemyAction({
      battle,
      enemy,
      action,
      enemyStates: [],
      playerStates: [],
    })

    expect(hint.type).toBe('skip')
    expect(hint.title).toBe(action.name)
  })

  it('AllyBuffSkill は予定ターゲット名を targetName に含める', () => {
    const { battle, enemies } = createBattleForHint()
    const source = enemies[0]!
    const target = enemies[1]!
    const action = new TailwindAction()
    action.setPlannedTarget(target.id)

    const hint = summarizeEnemyAction({
      battle,
      enemy: source,
      action,
      enemyStates: [],
      playerStates: [],
    })

    expect(hint.targetName).toBe(target.name)
    expect(hint.type).toBe('skill')
  })
})

describe('formatEnemyActionChipsForView', () => {
  it('攻撃の打点・回数の補正がDamagePatternに従って反映される（カテゴリはtypeを採用）', () => {
    const essentials: EssentialEnemyActionHint[] = [
      createEssential({
        key: 'attack-boosted',
        hint: {
          title: '乱れ突き',
          type: 'attack',
          pattern: { amount: 10, count: 2, type: 'multi' },
          calculatedPattern: { amount: 15, count: 1, type: 'multi' },
          description: '',
        },
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(1, essentials)

    expect(vm.category).toBe('attack')
    expect(vm.damage?.patternType).toBe('multi')
    expect(vm.damage?.icon).toBe('multi')
    expect(vm.damage?.amount).toBe(15)
    expect(vm.damage?.amountChange).toBe('up')
    // DamagePatternがmultiなら、countが1になっても連撃カテゴリのまま表示する
    expect(vm.damage?.count).toBe(1)
    expect(vm.damage?.countChange).toBe('down')
  })

  it('仲間へのバフスキルはtargetName付きでally対象としてエフェクトを生成する', () => {
    const essentials: EssentialEnemyActionHint[] = [
      createEssential({
        key: 'ally-buff',
        targetName: 'オーク力士',
        hint: {
          title: '追い風',
          type: 'skill',
          description: '',
          targetName: 'オーク力士',
          status: {
            name: '攻撃回数アップ',
            description: '次の攻撃回数を増やす',
            stackable: false,
            iconPath: '/assets/icons/status_up.png',
            magnitude: undefined,
          },
        },
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(2, essentials)
    const stateEffect = vm.effects.find((effect) => effect.kind === 'state')

    expect(vm.category).toBe('skill')
    expect(stateEffect?.target).toBe('ally')
    expect(stateEffect?.targetName).toBe('オーク力士')
    expect(stateEffect?.label).toBe('攻撃回数アップ')
  })

  it('行動不可はskipカテゴリとしてskipReason付きで返す', () => {
    const essentials: EssentialEnemyActionHint[] = [
      createEssential({
        key: 'skip',
        hint: {
          title: '行動不可',
          type: 'skip',
          description: 'スタン中',
        },
        acted: false,
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(3, essentials)

    expect(vm.category).toBe('skip')
    expect(vm.skipReason).toBe('cannot-act')
    expect(vm.effects.length).toBe(0)
  })
})
