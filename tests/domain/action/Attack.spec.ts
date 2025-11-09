import { describe, it, expect, vi } from 'vitest'
import { Attack, type AttackProps } from '@/domain/entities/Action'
import { Damages } from '@/domain/entities/Damages'
import { TargetEnemyOperation, type Operation, type CardOperation } from '@/domain/entities/operations'
import type { Battle } from '@/domain/battle/Battle'
import type { Enemy } from '@/domain/entities/Enemy'
import { Player } from '@/domain/entities/Player'
import { Enemy as EnemyEntity } from '@/domain/entities/Enemy'
import { State } from '@/domain/entities/State'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '@/domain/entities/cardTags'
import { EnemySingleTargetCardTag, SingleAttackCardTag } from '@/domain/entities/cardTags'

class TestPlayer extends Player {
  private readonly customStates: State[] = []

  constructor() {
    super({
      id: 'player',
      name: 'プレイヤー',
      maxHp: 30,
      currentHp: 30,
      maxMana: 3,
      currentMana: 3,
    })
  }

  override getStates(): State[] {
    return [...this.customStates]
  }

  addCustomState(state: State): void {
    this.customStates.push(state)
  }
}

class TestAttack extends Attack {
  constructor(overrides?: Partial<AttackProps>) {
    super({
      name: 'テスト攻撃',
      cardDefinition: {
        title: 'テスト攻撃',
        cardType: 'attack',
        type: new SingleAttackCardTag(),
        target: new EnemySingleTargetCardTag(),
        cost: 1,
      },
      baseDamage: new Damages({ baseAmount: 10, baseCount: 1, type: 'single' }),
      ...(overrides ?? {}),
    })
  }

  override description(): string {
    return 'テスト用攻撃'
  }


  exposeShouldRequireOperation(operation: Operation, params: { battle: Battle; source: Player | Enemy; operations: CardOperation[] }): boolean {
    return this.shouldRequireOperation(operation, params)
  }
}

function createBattleStub(player: Player, enemy: EnemyEntity) {
  return {
    player,
    enemyTeam: {
      findEnemy: vi.fn((id: number) => (enemy.id === id ? enemy : undefined)),
      members: [enemy],
    },
    cardRepository: {},
    damagePlayer: vi.fn(),
  } as unknown as Battle
}

describe('Attack クラス', () => {
  it('攻撃種別のカードを複製しダメージプロファイルを更新する', () => {
    const attack = new TestAttack()
    const clone = attack.cloneWithDamages(new Damages({ baseAmount: 25, baseCount: 3, type: 'multi' }))

    expect(clone).not.toBe(attack)
    expect(clone.baseDamages.baseAmount).toBe(25)
    expect(clone.baseDamages.baseCount).toBe(3)
    expect(clone.baseDamages.type).toBe('multi')
    expect(attack.baseDamages.baseAmount).toBe(10)
  })

  it('敵行動時はターゲット選択操作を要求しない', () => {
    const attack = new TestAttack()
    const player = new TestPlayer()
    const enemy = new EnemyEntity({
      name: 'テスト敵',
      maxHp: 10,
      currentHp: 10,
      actions: [attack],
      image: '/enemy.png',
    })
    enemy.assignId(99)

    const battle = createBattleStub(player, enemy)
    const result = attack.exposeShouldRequireOperation(new TargetEnemyOperation(), {
      battle,
      source: enemy,
      operations: [],
    })

    expect(result).toBe(false)
  })

  it('プレイヤー行動時はターゲット選択操作が必要になる', () => {
    const attack = new TestAttack()
    const player = new TestPlayer()
    const enemy = new EnemyEntity({
      name: 'テスト敵',
      maxHp: 10,
      currentHp: 10,
      actions: [attack],
      image: '/enemy.png',
    })
    enemy.assignId(1)
    const battle = createBattleStub(player, enemy)

    const result = attack.exposeShouldRequireOperation(new TargetEnemyOperation(), {
      battle,
      source: player,
      operations: [],
    })

    expect(result).toBe(true)
  })

  it('prepareContext でターゲットを解決しメタデータを取得する', () => {
    const attack = new TestAttack()
    const player = new TestPlayer()
    const enemy = new EnemyEntity({
      name: 'ターゲット敵',
      maxHp: 10,
      currentHp: 10,
      actions: [attack],
      image: '/enemy.png',
    })
    enemy.assignId(7)
    const battle = createBattleStub(player, enemy)

    const context = attack.prepareContext({
      battle,
      source: player,
      operations: [{ type: TargetEnemyOperation.TYPE, payload: 7 }],
    })

    expect(context.target).toBe(enemy)
    expect(context.metadata).toEqual({ targetEnemyId: 7 })
  })
})
