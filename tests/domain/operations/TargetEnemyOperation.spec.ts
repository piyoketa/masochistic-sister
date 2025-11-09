import { describe, it, expect } from 'vitest'
import {
  TargetEnemyOperation,
  type OperationContext,
  type TargetEnemyAvailabilityEntry,
} from '@/domain/entities/operations'
import { Player } from '@/domain/entities/Player'
import { Enemy } from '@/domain/entities/Enemy'

function createPlayer(): Player {
  return new Player({
    id: 'player',
    name: 'プレイヤー',
    maxHp: 20,
    currentHp: 20,
    maxMana: 3,
    currentMana: 3,
  })
}

function createEnemy(id?: number, overrides?: Partial<{ hp: number }>): Enemy {
  const enemy = new Enemy({
    name: 'テスト敵',
    maxHp: 10,
    currentHp: overrides?.hp ?? 10,
    actions: [],
    image: '/enemy.png',
  })
  if (id !== undefined) {
    enemy.assignId(id)
  }
  return enemy
}

function createContext(enemies: Enemy[], player = createPlayer()): OperationContext {
  const all = [...enemies]
  return {
    player,
    battle: {
      player,
      enemyTeam: {
        findEnemy: (enemyId: number) => all.find((candidate) => candidate.id === enemyId),
        members: all,
      },
    } as unknown as OperationContext['battle'],
  }
}

describe('TargetEnemyOperation', () => {
  it('数値 ID から敵を解決しメタデータを返す', () => {
    const enemy = createEnemy(5)
    const context = createContext([enemy])
    const operation = new TargetEnemyOperation()

    operation.complete(5, context)

    expect(operation.enemy).toBe(enemy)
    expect(operation.toMetadata()).toEqual({ targetEnemyId: 5 })
  })

  it('未登録の敵 ID は例外になる', () => {
    const enemy = createEnemy(1)
    const context = createContext([enemy])
    const operation = new TargetEnemyOperation()

    expect(() => operation.complete(999, context)).toThrowError('Enemy 999 not found')
  })

  it('リポジトリ ID が無い敵はメタデータ生成時に例外を投げる', () => {
    const enemy = createEnemy() // ID 未設定
    const player = createPlayer()
    const context: OperationContext = {
      player,
      battle: {
        player,
        enemyTeam: {
          findEnemy: () => enemy,
          members: [enemy],
        },
      } as unknown as OperationContext['battle'],
    }
    const operation = new TargetEnemyOperation()

    operation.complete(0, context)

    expect(() => operation.toMetadata()).toThrowError('Enemy missing repository id')
  })

  it('不正なペイロードはバリデーションで検出される', () => {
    const enemy = createEnemy(3)
    const context = createContext([enemy])
    const operation = new TargetEnemyOperation()

    expect(() => operation.complete('invalid', context)).toThrowError(
      'Operation requires a valid numeric enemy id',
    )
  })

  it('describeAvailabilityで非アクティブな敵を選択不可として返す', () => {
    const inactive = createEnemy(2, { hp: 0 })
    inactive.setStatus('defeated')
    const context = createContext([inactive])
    const operation = new TargetEnemyOperation()

    const availability = operation.describeAvailability(context)

    expect(availability).toEqual<TargetEnemyAvailabilityEntry[]>([
      {
        enemyId: 2,
        selectable: false,
        reason: '戦闘不能または逃走中の敵には使用できません',
      },
    ])
  })

  it('追加の制限条件に違反する敵はcomplete時に例外となる', () => {
    const enemy = createEnemy(4)
    const context = createContext([enemy])
    const operation = new TargetEnemyOperation({
      restrictions: [
        {
          reason: 'テスト制限',
          test: () => false,
        },
      ],
    })

    expect(() => operation.complete(4, context)).toThrowError('テスト制限')
  })

  it('describeAvailabilityで制限理由が返却される', () => {
    const enemy = createEnemy(6)
    const context = createContext([enemy])
    const operation = new TargetEnemyOperation({
      restrictions: [
        {
          reason: 'テスト制限',
          test: () => false,
        },
      ],
    })

    const availability = operation.describeAvailability(context)

    expect(availability).toEqual([
      { enemyId: 6, selectable: false, reason: 'テスト制限' },
    ])
  })
})
