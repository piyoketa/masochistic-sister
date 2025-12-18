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
import type { AttackSingleCardInfo } from '@/types/battle'
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

type AttackHintParams = {
  key: string
  title: string
  cardId?: string
  targetName?: string
  acted?: boolean
  description?: string
  pattern: NonNullable<EssentialEnemyActionHint['hint']['pattern']>
  calculatedPattern?: EssentialEnemyActionHint['hint']['calculatedPattern']
  status?: EssentialEnemyActionHint['hint']['status']
  cardInfo?: EssentialEnemyActionHint['hint']['cardInfo']
}

function buildAttackEssential(params: AttackHintParams): EssentialEnemyActionHint {
  // 攻撃系ヒントを組み立てる補助。テストケースごとにパラメータ差分だけを記述する。
  return createEssential({
    key: params.key,
    acted: params.acted,
    targetName: params.targetName,
    hint: {
      title: params.title,
      type: 'attack',
      description: params.description ?? '',
      cardId: params.cardId,
      pattern: params.pattern,
      calculatedPattern: params.calculatedPattern,
      status: params.status,
      cardInfo: params.cardInfo,
      targetName: params.targetName,
    },
  })
}

type SkillHintParams = {
  key: string
  title: string
  targetName?: string
  acted?: boolean
  description?: string
  status?: EssentialEnemyActionHint['hint']['status']
  selfState?: EssentialEnemyActionHint['hint']['selfState']
}

function buildSkillEssential(params: SkillHintParams): EssentialEnemyActionHint {
  // スキル系ヒントを組み立てる補助。カードIDを持たないスキルも扱いやすくする。
  return createEssential({
    key: params.key,
    acted: params.acted,
    targetName: params.targetName,
    hint: {
      title: params.title,
      type: 'skill',
      description: params.description ?? '',
      targetName: params.targetName,
      status: params.status,
      selfState: params.selfState,
    },
  })
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
  it('殴打（単発攻撃）はカードオーバーレイ付きで表示される', () => {
    const essentials = [
      buildAttackEssential({
        key: 'tackle',
        title: '殴打',
        cardId: 'tackle',
        pattern: { amount: 12, count: 1, type: 'single' },
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(1, essentials)

    expect(vm.category).toBe('attack')
    expect(vm.title).toBe('殴打')
    expect(vm.hoverCardSource?.cardId).toBe('tackle')
    expect(vm.hoverCardSource?.show).toBe(true)
    expect(vm.damage?.icon).toBe('single')
    expect(vm.damage?.amount).toBe(12)
    expect(vm.effects).toHaveLength(0)
  })

  it('乱れ突き（連続攻撃）は連撃アイコンと回数を表示する', () => {
    const essentials = [
      buildAttackEssential({
        key: 'flurry',
        title: '乱れ突き',
        cardId: 'flurry',
        pattern: { amount: 5, count: 3, type: 'multi' },
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(2, essentials)

    expect(vm.category).toBe('attack')
    expect(vm.damage?.icon).toBe('multi')
    expect(vm.damage?.patternType).toBe('multi')
    expect(vm.damage?.amount).toBe(5)
    expect(vm.damage?.count).toBe(3)
    expect(vm.hoverCardSource?.show).toBe(true)
  })

  it('溶かす（状態異常付与攻撃）は状態異常エフェクトを含む', () => {
    const essentials = [
      buildAttackEssential({
        key: 'acid-spit',
        title: '溶かす',
        cardId: 'acid-spit',
        pattern: { amount: 6, count: 1, type: 'single' },
        status: {
          name: '腐食',
          description: '防御を削る',
          iconPath: '/assets/icons/debuff.png',
          stackable: true,
          magnitude: 1,
        },
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(3, essentials)
    const stateEffect = vm.effects.find((effect) => effect.kind === 'state')

    expect(vm.category).toBe('attack')
    expect(stateEffect?.label).toBe('腐食(1点)')
    expect(stateEffect?.tooltip).toBe('防御を削る')
    expect(stateEffect?.target).toBe('player')
    expect(vm.hoverCardSource?.cardId).toBe('acid-spit')
  })

  it('口づけ（CardEffectTag）はタグ情報をエフェクトとして表示する', () => {
    const effectCardInfo: AttackSingleCardInfo = {
      id: 'devils-kiss',
      title: '口づけ',
      type: 'attack',
      attackStyle: 'single',
      cost: 1,
      primaryTags: [],
      categoryTags: [],
      descriptionSegments: [],
      damageAmount: 12,
      effectTags: [
        { id: 'tag-kiss', label: '魅了', description: '魅了を付与する' },
      ],
    }
    const essentials = [
      buildAttackEssential({
        key: 'devils-kiss',
        title: '口づけ',
        cardId: 'devils-kiss',
        pattern: { amount: 12, count: 1, type: 'single' },
        cardInfo: effectCardInfo,
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(4, essentials)
    const effectTag = vm.effects.find((effect) => effect.kind === 'card-effect-tag')

    expect(vm.category).toBe('attack')
    expect(effectTag?.label).toBe('魅了')
    expect(effectTag?.tooltip).toBe('魅了を付与する')
    expect(vm.hoverCardSource?.cardId).toBe('devils-kiss')
  })

  it('酒の息（デバフスキル）はカードなしで状態異常エフェクトを表示する', () => {
    const essentials = [
      buildSkillEssential({
        key: 'drunk-breath',
        title: '酒の息',
        status: {
          name: '酩酊',
          description: '命中率が下がる',
          iconPath: '/assets/icons/debuff.png',
          stackable: true,
          magnitude: 2,
        },
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(5, essentials)
    const stateEffect = vm.effects.find((effect) => effect.kind === 'state')

    expect(vm.category).toBe('skill')
    expect(vm.hoverCardSource).toBeUndefined()
    expect(stateEffect?.label).toBe('酩酊(2点)')
    expect(stateEffect?.tooltip).toBe('命中率が下がる')
    expect(stateEffect?.target).toBe('player')
  })

  it('ビルドアップ（自己バフ）はスタック値をラベルに含めて表示する', () => {
    const essentials = [
      buildSkillEssential({
        key: 'build-up',
        title: 'ビルドアップ',
        selfState: {
          name: '打点上昇',
          description: '次の攻撃で打点が上がる',
          iconPath: '/assets/icons/buff.png',
          stackable: true,
          magnitude: 10,
        },
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(6, essentials)
    const selfBuff = vm.effects.find((effect) => effect.kind === 'state')

    expect(vm.category).toBe('skill')
    expect(selfBuff?.label).toBe('打点上昇(10点)')
    expect(selfBuff?.target).toBe('self')
    expect(selfBuff?.magnitude).toBe(10)
  })

  it('追い風（仲間バフ）は対象名付きでally対象としてエフェクトを生成する', () => {
    const essentials: EssentialEnemyActionHint[] = [
      buildSkillEssential({
        key: 'ally-buff',
        targetName: 'オーク力士',
        title: '追い風',
        status: {
          name: '攻撃回数アップ',
          description: '次の攻撃回数を増やす',
          stackable: false,
          iconPath: '/assets/icons/status_up.png',
          magnitude: undefined,
        },
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(7, essentials)
    const stateEffect = vm.effects.find((effect) => effect.kind === 'state')

    expect(vm.category).toBe('skill')
    expect(stateEffect?.target).toBe('ally')
    expect(stateEffect?.targetName).toBe('オーク力士')
    expect(stateEffect?.label).toBe('攻撃回数アップ')
  })

  it('打点がバフで上昇した場合はamountChangeが上向きになる', () => {
    const essentials: EssentialEnemyActionHint[] = [
      buildAttackEssential({
        key: 'boosted-strike',
        title: '強化殴打',
        pattern: { amount: 10, count: 1, type: 'single' },
        calculatedPattern: { amount: 15, count: 1, type: 'single' },
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(8, essentials)

    expect(vm.damage?.amount).toBe(15)
    expect(vm.damage?.amountChange).toBe('up')
  })

  it('攻撃回数が補正された場合はcountChangeが付与される', () => {
    const essentials: EssentialEnemyActionHint[] = [
      buildAttackEssential({
        key: 'count-up',
        title: '加速突き',
        pattern: { amount: 3, count: 2, type: 'multi' },
        calculatedPattern: { amount: 3, count: 4, type: 'multi' },
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(9, essentials)

    expect(vm.damage?.count).toBe(4)
    expect(vm.damage?.countChange).toBe('up')
    expect(vm.damage?.icon).toBe('multi')
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

    const [vm] = formatEnemyActionChipsForView(10, essentials)

    expect(vm.category).toBe('skip')
    expect(vm.skipReason).toBe('cannot-act')
    expect(vm.effects.length).toBe(0)
  })

  it('actedフラグがtrueなら表示もactedになる', () => {
    const essentials: EssentialEnemyActionHint[] = [
      buildAttackEssential({
        key: 'already-acted',
        title: '殴打',
        acted: true,
        pattern: { amount: 8, count: 1, type: 'single' },
      }),
    ]

    const [vm] = formatEnemyActionChipsForView(11, essentials)

    expect(vm.acted).toBe(true)
  })
})
